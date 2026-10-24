/** 订阅操作系统明暗偏好，`system` 模式下用它决定最终生效主题。 */
import { useSyncExternalStore } from 'react';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(DARK_QUERY).matches;
}

/** 服务端/测试环境没有 matchMedia，按亮色处理。 */
const getServerSnapshot = () => false;

export function useSystemDark(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
