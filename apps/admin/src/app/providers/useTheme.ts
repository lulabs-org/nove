/** 读取当前主题状态：用户偏好、系统偏好、最终生效值。 */
import { resolveTheme, useThemeStore, type ResolvedTheme, type ThemeMode } from './themeStore';
import { useSystemDark } from './useSystemDark';

export interface ThemeContextValue {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

export function useTheme(): ThemeContextValue {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const toggle = useThemeStore((state) => state.toggle);
  const systemDark = useSystemDark();
  return { mode, resolved: resolveTheme(mode, systemDark), setMode, toggle };
}
