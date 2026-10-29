/** 读取当前主题：用户是否显式选过，最终生效值。 */
import { prefersDark, useThemeStore, type ResolvedTheme, type ThemeMode } from './themeStore';

export interface ThemeContextValue {
  /** null 表示跟随系统。 */
  mode: ThemeMode | null;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode | null) => void;
  toggle: () => void;
}

export function useTheme(): ThemeContextValue {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const toggle = useThemeStore((state) => state.toggle);
  // 只在没选过时读一次系统偏好，不订阅它的后续变化。
  return { mode, resolved: mode ?? (prefersDark() ? 'dark' : 'light'), setMode, toggle };
}
