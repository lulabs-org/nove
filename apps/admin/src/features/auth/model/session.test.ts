import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authService } from '../api/service';
import type { User } from './types';

const CHANNEL_NAME = 'nove-admin-auth';
const user = { id: 'user-b' } as User;

function expiringJwt(sub: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 30 }));
  return `${header}.${payload}.signature`;
}

async function loadSession() {
  return import('./session');
}

describe('session kernel', () => {
  const channels: BroadcastChannel[] = [];

  function otherTab(): BroadcastChannel {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channels.push(channel);
    return channel;
  }

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  afterEach(() => {
    for (const channel of channels.splice(0)) {
      channel.close();
    }
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('broadcasts sign-in with the user to other tabs', async () => {
    const tab = otherTab();
    const received = new Promise<unknown>((resolve) => {
      tab.onmessage = (event) => resolve(event.data);
    });
    const session = await loadSession();

    session.saveSession('token-b', user);

    await expect(received).resolves.toEqual({ event: 'SIGNED_IN', payload: { user } });
    expect(authService.getToken()).toBe('token-b');
  });

  it('adopts a sign-in from another tab and invalidates in-flight work', async () => {
    const session = await loadSession();
    const listener = vi.fn();
    session.onAuthStateChange(listener);
    const epoch = session.getSessionEpoch();

    otherTab().postMessage({ event: 'SIGNED_IN', payload: { user } });

    await vi.waitFor(() => expect(listener).toHaveBeenCalledWith('SIGNED_IN', { user }));
    expect(session.isCurrentSession(epoch)).toBe(false);
  });

  it('does not invalidate in-flight work when another tab only refreshed', async () => {
    const session = await loadSession();
    const listener = vi.fn();
    session.onAuthStateChange(listener);
    const epoch = session.getSessionEpoch();

    otherTab().postMessage({ event: 'TOKEN_REFRESHED', payload: { user: null } });

    await vi.waitFor(() =>
      expect(listener).toHaveBeenCalledWith('TOKEN_REFRESHED', { user: null })
    );
    expect(session.isCurrentSession(epoch)).toBe(true);
  });

  it('only broadcasts sign-out when a token was actually removed', async () => {
    const tab = otherTab();
    const messages: unknown[] = [];
    tab.onmessage = (event) => messages.push(event.data);
    const session = await loadSession();
    const listener = vi.fn();
    session.onAuthStateChange(listener);

    session.removeSession();
    authService.setToken('token-a');
    session.removeSession();

    await vi.waitFor(() => expect(messages).toHaveLength(1));
    expect(messages[0]).toEqual({ event: 'SIGNED_OUT', payload: { user: null } });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('keeps notifying other listeners when one throws', async () => {
    const session = await loadSession();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const second = vi.fn();
    session.onAuthStateChange(() => {
      throw new Error('listener failed');
    });
    session.onAuthStateChange(second);

    session.removeSession();

    expect(second).toHaveBeenCalledWith('SIGNED_OUT', { user: null });
  });

  it('steals the refresh lock when it is not released in time', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const request = vi.fn(
      (
        _name: string,
        options: { signal?: AbortSignal; steal?: boolean },
        callback: () => unknown
      ) => {
        if (options.steal) {
          return Promise.resolve(callback());
        }
        return new Promise((_, reject) => {
          options.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        });
      }
    );
    vi.stubGlobal('navigator', { ...navigator, locks: { request } });
    const session = await loadSession();
    authService.setToken(expiringJwt('user-a'));
    const nextToken = expiringJwt('user-a').replace('signature', 'next');

    const pending = session.refreshSession(async () => nextToken);
    await vi.advanceTimersByTimeAsync(20_000);

    await expect(pending).resolves.toBe(nextToken);
    expect(request).toHaveBeenLastCalledWith(
      'lock:nove-admin-auth',
      { mode: 'exclusive', steal: true },
      expect.any(Function)
    );
  });
});
