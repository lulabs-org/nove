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

  it('shares one refresh for concurrent 401s and retries with the new token', async () => {
    await import('./mutator');
    authService.setToken('expired-token');
    let releaseRefresh!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });
    const refresh = vi.fn(async (config: InternalAxiosRequestConfig) => {
      await gate;
      return response(config, { accessToken: 'new-token' });
    });
    const requests = vi.fn(async (config: InternalAxiosRequestConfig) => {
      if (config.headers.get('Authorization') !== 'Bearer new-token') throw unauthorized(config);
      return response(config);
    });
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
    expect(requests).toHaveBeenCalledTimes(4);
    expect(authService.getToken()).toBe('new-token');
    expect(refresh.mock.calls[0][0].url).toBe('/api/auth/refresh-token');
    expect(JSON.parse(refresh.mock.calls[0][0].data)).toMatchObject({
      clientType: 'web',
      deviceId: 'test-device',
    });
  });

  it('clears credentials and emits one event when concurrent refresh attempts fail', async () => {
    await import('./mutator');
    authService.setToken('expired-token');
    const dispatch = vi.spyOn(window, 'dispatchEvent');
    http.defaults.adapter = async (config) => {
      throw unauthorized(config);
    };

    const results = await Promise.allSettled([http.get('/api/projects'), http.get('/api/users')]);
    expect(results.every((result) => result.status === 'rejected')).toBe(true);
    expect(authService.getToken()).toBeNull();
    expect(
      dispatch.mock.calls.filter(([event]) => event.type === 'auth-unauthorized')
    ).toHaveLength(1);
  });

  it('logs out after a retried request is still unauthorized without refreshing again', async () => {
    await import('./mutator');
    const dispatch = vi.spyOn(window, 'dispatchEvent');
    const refresh = vi.fn(async (config: InternalAxiosRequestConfig) =>
      response(config, { accessToken: 'invalid-token' })
    );
    const requests = vi.fn(async (config: InternalAxiosRequestConfig) => {
      throw unauthorized(config);
    });
    http.defaults.adapter = async (config) => {
      if (config.url === AUTH_ENDPOINTS.REFRESH_TOKEN) {
        return refresh(config);
      }
      return requests(config);
    };

    await expect(http.get('/api/projects')).rejects.toMatchObject({ response: { status: 401 } });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(requests).toHaveBeenCalledTimes(2);
    expect(authService.getToken()).toBeNull();
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'auth-unauthorized' }));
  });

  it('does not refresh or log out for a rejected public login', async () => {
    await import('./mutator');
    authService.setToken('existing-token');
    const refresh = vi.fn();
    const dispatch = vi.spyOn(window, 'dispatchEvent');
    http.defaults.adapter = async (config) => {
      if (config.url === AUTH_ENDPOINTS.REFRESH_TOKEN) {
        return refresh(config);
      }
      throw unauthorized(config);
    };
    await expect(http.post('/api/auth/login')).rejects.toMatchObject({ response: { status: 401 } });
    expect(refresh).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
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
