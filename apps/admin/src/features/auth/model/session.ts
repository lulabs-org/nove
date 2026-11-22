/**
 * 会话内核：所有对登录会话（access token）的写入都经过这里。
 *
 * - 每次登录、退出、收到其他标签页的登录/退出都会让 sessionEpoch 加一；
 *   发起异步操作时记下 epoch，完成时 epoch 变了就丢弃结果。
 * - 刷新 token 在同一标签页内共用一个 Promise，跨标签页用 Web Locks 串行。
 * - 会话变化通过 BroadcastChannel 同步给其他标签页。
 *
 * 订阅回调里只能更新状态，不要再调用 refreshSession / removeSession 等写入函数。
 *
 * Portions adapted from supabase-js auth-js (MIT License, Copyright (c) 2020 Supabase),
 * commit 840843d4ccd2b96f24fb218898bb90f80ad8b968:
 * packages/core/auth-js/src/GoTrueClient.ts and packages/core/auth-js/src/lib/locks.ts
 */
import { authService } from '../api/service';
import { getTokenSubject, isTokenExpiringSoon } from './jwt';
import type { User } from './types';

export type AuthChangeEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED';

export interface AuthChangePayload {
  user: User | null;
}

type AuthChangeListener = (event: AuthChangeEvent, payload: AuthChangePayload) => void;

interface AuthBroadcastMessage {
  event: AuthChangeEvent;
  payload: AuthChangePayload;
}

const CHANNEL_NAME = 'nove-admin-auth';
const LOCK_NAME = `lock:${CHANNEL_NAME}`;
// 需大于刷新请求超时（15s），否则会抢走另一个标签页仍在进行中的刷新锁
const LOCK_ACQUIRE_TIMEOUT_MS = 20_000;

/**
 * 会话在异步操作期间发生了变化，结果已丢弃
 */
export class SessionChangedError extends Error {
  constructor(message = '会话已变化，结果已丢弃') {
    super(message);
    this.name = 'SessionChangedError';
  }
}

export function isSessionChangedError(error: unknown): error is SessionChangedError {
  return error instanceof Error && error.name === 'SessionChangedError';
}

let sessionEpoch = 0;
let refreshing: Promise<string> | null = null;
const listeners = new Set<AuthChangeListener>();
let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && typeof globalThis.BroadcastChannel === 'function') {
  try {
    broadcastChannel = new globalThis.BroadcastChannel(CHANNEL_NAME);
  } catch (error) {
    console.error('BroadcastChannel 不可用，多标签页会话同步已关闭', error);
  }

  broadcastChannel?.addEventListener('message', (event: MessageEvent<AuthBroadcastMessage>) => {
    const { event: authEvent, payload } = event.data;
    // 其他标签页换了身份：本标签页进行中的异步操作都属于旧会话
    if (authEvent === 'SIGNED_IN' || authEvent === 'SIGNED_OUT') {
      sessionEpoch += 1;
    }
    notifyAllSubscribers(authEvent, payload, false);
  });
}

function notifyAllSubscribers(
  event: AuthChangeEvent,
  payload: AuthChangePayload,
  broadcast = true
): void {
  if (broadcastChannel && broadcast) {
    broadcastChannel.postMessage({ event, payload } satisfies AuthBroadcastMessage);
  }

  for (const listener of listeners) {
    try {
      listener(event, payload);
    } catch (error) {
      console.error(error);
    }
  }
}

/**
 * 订阅会话变化，返回取消订阅函数
 */
export function onAuthStateChange(listener: AuthChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAccessToken(): string | null {
  return authService.getToken();
}

/**
 * 发起异步操作前调用，记下当前会话编号
 */
export function getSessionEpoch(): number {
  return sessionEpoch;
}

/**
 * 异步操作完成后调用，判断它发起时的会话是否仍是当前会话
 */
export function isCurrentSession(epoch: number): boolean {
  return epoch === sessionEpoch;
}

/**
 * 登录成功后一次性写入 token 和用户，并通知所有标签页
 */
export function saveSession(accessToken: string, user: User): void {
  sessionEpoch += 1;
  authService.setToken(accessToken);
  notifyAllSubscribers('SIGNED_IN', { user });
}

/**
 * 结束当前会话；只有确实持有 token 时才广播给其他标签页
 */
export function removeSession(): void {
  sessionEpoch += 1;
  const hadToken = authService.getToken() !== null;
  authService.removeToken();
  notifyAllSubscribers('SIGNED_OUT', { user: null }, hadToken);
}

/**
 * 刷新 access token。
 *
 * fetchAccessToken 负责实际的网络请求（refresh token 在 httpOnly cookie 中），
 * 由 HTTP 层传入以避免循环依赖。
 *
 * 失败时抛出原始错误；会话在刷新期间变化时抛出 SessionChangedError。
 * 是否因失败而结束会话由调用方决定。
 */
export function refreshSession(fetchAccessToken: () => Promise<string>): Promise<string> {
  if (refreshing) {
    return refreshing;
  }

  const epochAtStart = sessionEpoch;
  const tokenAtStart = authService.getToken();

  refreshing = withLock(LOCK_NAME, LOCK_ACQUIRE_TIMEOUT_MS, async () => {
    // 拿到锁后重新读取存储：等锁期间可能已被其他标签页刷新或退出
    const current = authService.getToken();
    if (!current || !isCurrentSession(epochAtStart)) {
      throw new SessionChangedError();
    }
    if (current !== tokenAtStart && !isTokenExpiringSoon(current)) {
      return current;
    }

    let accessToken: string;
    try {
      accessToken = await fetchAccessToken();
    } catch (error) {
      // 刷新失败不代表没有会话：其他标签页可能已提交了新 token
      const stored = authService.getToken();
      if (
        stored &&
        stored !== current &&
        isCurrentSession(epochAtStart) &&
        !isTokenExpiringSoon(stored)
      ) {
        return stored;
      }
      throw error;
    }

    // 提交前检查：请求期间会话被替换或清除，丢弃新 token
    if (!isCurrentSession(epochAtStart) || authService.getToken() !== current) {
      throw new SessionChangedError();
    }

    // 新 token 必须属于同一用户，否则视为会话被替换
    const previousSubject = getTokenSubject(current);
    const nextSubject = getTokenSubject(accessToken);
    if (previousSubject && nextSubject && previousSubject !== nextSubject) {
      removeSession();
      throw new SessionChangedError('刷新得到的 token 属于其他用户，已退出登录');
    }

    authService.setToken(accessToken);
    notifyAllSubscribers('TOKEN_REFRESHED', { user: null });
    return accessToken;
  }).finally(() => {
    refreshing = null;
  });

  return refreshing;
}

/**
 * 基于 Web Locks 的跨标签页互斥锁；不支持时直接执行（同标签页仍有 refreshing 去重）。
 * 获取超时说明锁被遗留（例如持有锁的标签页卡住），此时抢占锁继续执行。
 */
async function withLock<R>(name: string, acquireTimeout: number, fn: () => Promise<R>): Promise<R> {
  const locks = globalThis.navigator?.locks;
  if (!locks) {
    return fn();
  }

  const abortController = new globalThis.AbortController();
  const acquireTimeoutTimer = setTimeout(() => {
    abortController.abort();
  }, acquireTimeout);

  try {
    return await locks.request(
      name,
      { mode: 'exclusive', signal: abortController.signal },
      async () => {
        clearTimeout(acquireTimeoutTimer);
        return await fn();
      }
    );
  } catch (error) {
    clearTimeout(acquireTimeoutTimer);

    if (
      error !== null &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === 'AbortError' &&
      abortController.signal.aborted
    ) {
      console.warn(`锁 "${name}" 在 ${acquireTimeout}ms 内未释放，强制获取以恢复`);
      return await locks.request(name, { mode: 'exclusive', steal: true }, async () => await fn());
    }

    throw error;
  }
}
