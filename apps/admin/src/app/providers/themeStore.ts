/**
 * 主题偏好。
 *
 * 三态：light / dark 由用户显式选择，system 跟随操作系统。
 * 只存 localStorage 裸字符串（`nove-admin:theme`），不用 zustand persist：
 * 首帧防闪脚本要在 React 启动前读这个值，裸字符串比 persist 的 JSON 信封更好解析。
 */
import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'nove-admin:theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

/** 浏览器是否会以暗色渲染原生控件；不支持 matchMedia 时（如测试环境）按亮色处理。 */
export function prefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(DARK_QUERY).matches;
}

/** 把用户偏好解析成最终生效的明暗。 */
export function resolveTheme(mode: ThemeMode, systemDark: boolean): ResolvedTheme {
  if (mode === 'system') return systemDark ? 'dark' : 'light';
  return mode;
}

function readStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // 隐私模式等场景下 localStorage 可能不可用，回落到跟随系统。
  }
  return 'system';
}

function persistMode(mode: ThemeMode): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // 写不进去也不该中断当前会话。
  }
}

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** 在亮/暗之间切换；从 system 出发时，切到当前生效模式的相反值。 */
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: readStoredMode(),

  setMode: (mode) => {
    persistMode(mode);
    set({ mode });
  },

  toggle: () => {
    const { mode, setMode } = get();
    const next: ResolvedTheme = resolveTheme(mode, prefersDark()) === 'dark' ? 'light' : 'dark';
    setMode(next);
  },
}));
