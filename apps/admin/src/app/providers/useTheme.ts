/** 读取当前主题：用户是否显式选过，最终生效值。 */
import { prefersDark, useThemeStore, type ResolvedTheme } from './themeStore';

export interface ThemeContextValue {
  resolved: ResolvedTheme;
  toggle: () => void;
}

export function useTheme(): ThemeContextValue {
  const mode = useThemeStore((state) => state.mode);
  const toggle = useThemeStore((state) => state.toggle);
  // 只在没选过时读一次系统偏好，不订阅它的后续变化。
  return { resolved: mode ?? (prefersDark() ? 'dark' : 'light'), toggle };
}
