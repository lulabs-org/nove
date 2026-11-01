/**
 * 主题偏好。
 *
 * 只有「用户显式选过亮/暗」这一种状态会被记住；没选过就是 null，按操作系统偏好渲染。
 * 只存 localStorage 裸字符串（`nove-admin:theme`），不用 zustand persist：
 * 首帧防闪脚本要在 React 启动前读这个值，裸字符串比 persist 的 JSON 信封更好解析。
 */
import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';
export type ResolvedTheme = ThemeMode;

export const THEME_STORAGE_KEY = 'nove-admin:theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

/** 浏览器是否会以暗色渲染原生控件；不支持 matchMedia 时（如测试环境）按亮色处理。 */
export function prefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(DARK_QUERY).matches;
}

/** 没存过偏好时返回 null，调用方据此回落到操作系统设置。 */
function readStoredMode(): ThemeMode | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // 隐私模式等场景下 localStorage 可能不可用，按未设置处理。
  }
  return null;
}

/** `null` 表示「跟随系统」，此时删掉存储项，而不是写一个特殊值。 */
function persistMode(mode: ThemeMode | null): void {
  try {
    if (mode === null) window.localStorage.removeItem(THEME_STORAGE_KEY);
    else window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // 写不进去也不该中断当前会话。
  }
}

interface ThemeState {
  mode: ThemeMode | null;
  /** 显式指定亮/暗，传 null 回到跟随系统。 */
  setMode: (mode: ThemeMode | null) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: readStoredMode(),

  setMode: (mode) => {
    persistMode(mode);
    set({ mode });
  },
}));
