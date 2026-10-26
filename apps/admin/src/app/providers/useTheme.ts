/** 读取当前主题：用户是否显式选过、系统偏好、最终生效值。 */
import { useThemeStore, type ResolvedTheme } from './themeStore';
import { useSystemDark } from './useSystemDark';

export interface ThemeContextValue {
  resolved: ResolvedTheme;
  toggle: () => void;
}

export function useTheme(): ThemeContextValue {
  const mode = useThemeStore((state) => state.mode);
  const toggle = useThemeStore((state) => state.toggle);
  const systemDark = useSystemDark();
  return { resolved: mode ?? (systemDark ? 'dark' : 'light'), toggle };
}
