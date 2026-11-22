import axios, {
  AxiosError,
  AxiosHeaders,
  CanceledError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authService } from '../../../features/auth/api/service';

const { showError } = vi.hoisted(() => ({ showError: vi.fn() }));
vi.mock('antd', () => ({ message: { error: showError } }));
vi.mock('../../../features/auth/model/device', () => ({
  getDeviceId: () => 'test-device',
  getDeviceInfo: () => ({ browser: 'test' }),
}));

function response(config: InternalAxiosRequestConfig, data: unknown = {}, status = 200) {
  return { config, data, status, statusText: String(status), headers: new AxiosHeaders() };
}

function unauthorized(config: InternalAxiosRequestConfig) {
  return new AxiosError(
    'Unauthorized',
    'ERR_BAD_REQUEST',
    config,
    undefined,
    response(config, {}, 401)
  );
}

function jwt(claims: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  return `${header}.${btoa(JSON.stringify(claims))}.signature`;
}

function expiringJwt(sub = 'user-a'): string {
  return jwt({ sub, exp: Math.floor(Date.now() / 1000) + 30 });
}

function freshJwt(sub = 'user-a'): string {
  return jwt({ sub, exp: Math.floor(Date.now() / 1000) + 900 });
}

async function loadMutator() {
  await import('./mutator');
  const session = await import('../../../features/auth/model/session');
  const events: string[] = [];
  session.onAuthStateChange((event) => events.push(event));
  return { session, signedOut: () => events.filter((event) => event === 'SIGNED_OUT').length };
}

const AUTH_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  RESET_PASSWORD: '/api/auth/reset-password',
  REFRESH_TOKEN: '/api/auth/refresh-token',
} as const;

describe('HTTP authentication and request handling', () => {
  let http: AxiosInstance;
  const originalAxiosCreate = axios.create.bind(axios);

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorage.clear();
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test///');

    vi.spyOn(axios, 'create').mockImplementation((config) => {
      http = originalAxiosCreate(config);
      return http;
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('normalizes the base URL and applies a timeout to refresh requests', async () => {
    await import('./mutator');
    expect(http.defaults.baseURL).toBe('https://api.example.test');
    expect(http.defaults.timeout).toBe(15000);
    expect(http.defaults.withCredentials).toBe(true);
  });

  it('injects a token only for protected requests and preserves the caller request ID', async () => {
    await import('./mutator');
    authService.setToken('existing-token');
    http.defaults.adapter = async (config) => response(config);

    const protectedResponse = await http.get('/api/projects', {
      headers: { 'X-Request-Id': 'caller-id' },
    });
    expect(protectedResponse.config.headers.get('Authorization')).toBe('Bearer existing-token');
    expect(protectedResponse.config.headers.get('x-request-id')).toBe('caller-id');

    for (const url of Object.values(AUTH_ENDPOINTS)) {
      const result = await http.post(url);
      expect(result.config.headers.get('Authorization')).toBeUndefined();
      expect(result.config.headers.get('x-request-id')).toEqual(expect.any(String));
    }
  });

  it('generates a request ID when randomUUID is unavailable', async () => {
    vi.stubGlobal('crypto', {});
    await import('./mutator');
    http.defaults.adapter = async (config) => response(config);
    const result = await http.get('/api/projects');
    expect(result.config.headers.get('x-request-id')).toMatch(/^\d+-[a-z0-9]+$/);
  });

  it.each(['base64', 'base64url'])(
    'proactively refreshes an expiring JWT with a %s payload',
    async (encoding) => {
      await import('./mutator');
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const encodedPayload = btoa(
        JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 30, nonce: '~~~???' })
      );
      const payload =
        encoding === 'base64url'
          ? encodedPayload.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
          : encodedPayload;
      const expiringJwt = `${header}.${payload}.signature`;
      authService.setToken(expiringJwt);

      const refresh = vi.fn(async (config: InternalAxiosRequestConfig) =>
        response(config, { accessToken: 'proactively-refreshed-token' })
      );
      const requests = vi.fn(async (config: InternalAxiosRequestConfig) => response(config));

      http.defaults.adapter = async (config) => {
        if (config.url === AUTH_ENDPOINTS.REFRESH_TOKEN) {
          return refresh(config);
        }
        return requests(config);
      };

      await http.get('/api/projects');
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(requests).toHaveBeenCalledTimes(1);
      expect(requests.mock.calls[0][0].headers.get('Authorization')).toBe(
        'Bearer proactively-refreshed-token'
      );
      expect(authService.getToken()).toBe('proactively-refreshed-token');
    }
  );

  it('preserves an undecodable token without attempting proactive refresh', async () => {
    await import('./mutator');
    const token = 'header.invalid!payload.signature';
    authService.setToken(token);
    const requests = vi.fn(async (config: InternalAxiosRequestConfig) => response(config));
    http.defaults.adapter = requests;

    const result = await http.get('/api/projects');

    expect(requests).toHaveBeenCalledTimes(1);
    expect(result.config.url).toBe('/api/projects');
    expect(result.config.headers.get('Authorization')).toBe(`Bearer ${token}`);
    expect(authService.getToken()).toBe(token);
  });

  it('shares one proactive refresh for concurrent requests when token is expiring soon', async () => {
    await import('./mutator');
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 30 }));
    authService.setToken(`${header}.${payload}.signature`);

    let releaseRefresh!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });
    const refresh = vi.fn(async (config: InternalAxiosRequestConfig) => {
      await gate;
      return response(config, { accessToken: 'new-token' });
    });
    const requests = vi.fn(async (config: InternalAxiosRequestConfig) => response(config));

    http.defaults.adapter = async (config) => {
      if (config.url === AUTH_ENDPOINTS.REFRESH_TOKEN) {
        return refresh(config);
      }
      return requests(config);
    };

    const pending = Promise.all([http.get('/api/projects'), http.get('/api/users')]);
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    releaseRefresh();
    const results = await pending;

    expect(results).toHaveLength(2);
    expect(requests).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(authService.getToken()).toBe('new-token');
  });

  it('clears credentials and ends the session once when proactive refresh fails', async () => {
    const { signedOut } = await loadMutator();
    authService.setToken(expiringJwt());

    http.defaults.adapter = async (config) => {
      if (config.url === AUTH_ENDPOINTS.REFRESH_TOKEN) {
        throw unauthorized(config);
      }
      return response(config);
    };

    const results = await Promise.allSettled([http.get('/api/projects'), http.get('/api/users')]);
    expect(results.every((result) => result.status === 'rejected')).toBe(true);
    expect(authService.getToken()).toBeNull();
    expect(signedOut()).toBe(1);
  });

  it('keeps the session when proactive refresh fails without a response', async () => {
    const { signedOut } = await loadMutator();
    const token = expiringJwt();
    authService.setToken(token);

    http.defaults.adapter = async (config) => {
      if (config.url === AUTH_ENDPOINTS.REFRESH_TOKEN) {
        throw new AxiosError('Network Error', 'ERR_NETWORK', config);
      }
      return response(config);
    };

    await expect(http.get('/api/projects')).rejects.toMatchObject({ code: 'ERR_NETWORK' });
    expect(authService.getToken()).toBe(token);
    expect(signedOut()).toBe(0);
  });

  it('logs out and clears credentials on 401 response for protected requests', async () => {
    const { signedOut } = await loadMutator();
    authService.setToken('valid-token');
    http.defaults.adapter = async (config) => {
      throw unauthorized(config);
    };

    await expect(http.get('/api/projects')).rejects.toMatchObject({ response: { status: 401 } });
    expect(authService.getToken()).toBeNull();
    expect(signedOut()).toBe(1);
  });

  it('ignores a 401 for a request sent by the previous session', async () => {
    const { session, signedOut } = await loadMutator();
    authService.setToken('token-a');
    let releaseRequest!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseRequest = resolve;
    });
    const sent = vi.fn();
    http.defaults.adapter = async (config) => {
      sent();
      await gate;
      throw unauthorized(config);
    };

    const pending = http.get('/api/projects');
    await vi.waitFor(() => expect(sent).toHaveBeenCalled());
    session.saveSession('token-b', { id: 'user-b' } as never);
    releaseRequest();

    await expect(pending).rejects.toMatchObject({ response: { status: 401 } });
    expect(authService.getToken()).toBe('token-b');
    expect(signedOut()).toBe(0);
  });

  it('discards a refreshed token when the session changes during the refresh', async () => {
    const { session } = await loadMutator();
    authService.setToken(expiringJwt('user-a'));
    let releaseRefresh!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });
    const refreshSent = vi.fn();
    const requests = vi.fn(async (config: InternalAxiosRequestConfig) => response(config));
    http.defaults.adapter = async (config) => {
      if (config.url === AUTH_ENDPOINTS.REFRESH_TOKEN) {
        refreshSent();
        await gate;
        return response(config, { accessToken: freshJwt('user-a') });
      }
      return requests(config);
    };

    const pending = http.get('/api/projects');
    await vi.waitFor(() => expect(refreshSent).toHaveBeenCalled());
    const tokenB = freshJwt('user-b');
    session.saveSession(tokenB, { id: 'user-b' } as never);
    releaseRefresh();

    await expect(pending).rejects.toMatchObject({ name: 'SessionChangedError' });
    expect(authService.getToken()).toBe(tokenB);
    expect(requests).not.toHaveBeenCalled();
  });

  it('ends the session when the refreshed token belongs to another user', async () => {
    const { signedOut } = await loadMutator();
    authService.setToken(expiringJwt('user-a'));
    const requests = vi.fn(async (config: InternalAxiosRequestConfig) => response(config));
    http.defaults.adapter = async (config) => {
      if (config.url === AUTH_ENDPOINTS.REFRESH_TOKEN) {
        return response(config, { accessToken: freshJwt('user-b') });
      }
      return requests(config);
    };

    await expect(http.get('/api/projects')).rejects.toMatchObject({ name: 'SessionChangedError' });
    expect(authService.getToken()).toBeNull();
    expect(signedOut()).toBe(1);
    expect(requests).not.toHaveBeenCalled();
  });

  it('uses the token another tab refreshed while this tab waited for the lock', async () => {
    const tokenFromOtherTab = freshJwt('user-a');
    vi.stubGlobal('navigator', {
      ...navigator,
      locks: {
        request: async (_name: string, _options: unknown, callback: () => Promise<unknown>) => {
          authService.setToken(tokenFromOtherTab);
          return callback();
        },
      },
    });
    await loadMutator();
    authService.setToken(expiringJwt('user-a'));
    const refresh = vi.fn();
    const requests = vi.fn(async (config: InternalAxiosRequestConfig) => response(config));
    http.defaults.adapter = async (config) => {
      if (config.url === AUTH_ENDPOINTS.REFRESH_TOKEN) {
        return refresh(config);
      }
      return requests(config);
    };

    await http.get('/api/projects');

    expect(refresh).not.toHaveBeenCalled();
    expect(requests.mock.calls[0][0].headers.get('Authorization')).toBe(
      `Bearer ${tokenFromOtherTab}`
    );
  });

  it('uses the token another tab committed when this refresh is rejected', async () => {
    const { signedOut } = await loadMutator();
    authService.setToken(expiringJwt('user-a'));
    const tokenFromOtherTab = freshJwt('user-a');
    const requests = vi.fn(async (config: InternalAxiosRequestConfig) => response(config));
    http.defaults.adapter = async (config) => {
      if (config.url === AUTH_ENDPOINTS.REFRESH_TOKEN) {
        authService.setToken(tokenFromOtherTab);
        throw unauthorized(config);
      }
      return requests(config);
    };

    await http.get('/api/projects');

    expect(signedOut()).toBe(0);
    expect(authService.getToken()).toBe(tokenFromOtherTab);
    expect(requests.mock.calls[0][0].headers.get('Authorization')).toBe(
      `Bearer ${tokenFromOtherTab}`
    );
  });

  it('keeps an explicit Authorization header and skips session handling', async () => {
    const { signedOut } = await loadMutator();
    authService.setToken(expiringJwt('user-a'));
    const refresh = vi.fn();
    http.defaults.adapter = async (config) => {
      if (config.url === AUTH_ENDPOINTS.REFRESH_TOKEN) {
        return refresh(config);
      }
      throw unauthorized(config);
    };

    await expect(
      http.get('/api/auth/me', { headers: { Authorization: 'Bearer explicit-token' } })
    ).rejects.toMatchObject({ config: { headers: expect.anything() } });

    expect(refresh).not.toHaveBeenCalled();
    expect(signedOut()).toBe(0);
  });

  it('does not refresh or log out for a rejected public login', async () => {
    const { signedOut } = await loadMutator();
    authService.setToken('existing-token');
    const refresh = vi.fn();
    http.defaults.adapter = async (config) => {
      if (config.url === AUTH_ENDPOINTS.REFRESH_TOKEN) {
        return refresh(config);
      }
      throw unauthorized(config);
    };
    await expect(http.post('/api/auth/login')).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(refresh).not.toHaveBeenCalled();
    expect(signedOut()).toBe(0);
    expect(authService.getToken()).toBe('existing-token');
  });

  it('rejects canceled requests without displaying an error', async () => {
    await import('./mutator');
    const canceled = new CanceledError('Canceled');
    http.defaults.adapter = async () => {
      throw canceled;
    };
    await expect(http.get('/api/projects')).rejects.toBe(canceled);
    expect(showError).not.toHaveBeenCalled();
  });

  it('unwraps response.data and merges custom options in mutator', async () => {
    const { mutator } = await import('./mutator');
    http.defaults.adapter = async (config) => {
      expect(config.headers?.get('X-Custom-Opt')).toBe('value');
      return response(config, { success: true, count: 42 });
    };

    const result = await mutator<{ success: boolean; count: number }>(
      { url: '/test', method: 'GET' },
      { headers: { 'X-Custom-Opt': 'value' } }
    );
    expect(result).toEqual({ success: true, count: 42 });
  });
});
