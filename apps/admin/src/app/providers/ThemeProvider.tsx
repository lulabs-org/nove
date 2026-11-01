import { useLayoutEffect, type ReactNode } from 'react';
import ConfigProvider from 'antd/es/config-provider';
import theme from 'antd/es/theme';
import { useTheme } from './useTheme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { resolved } = useTheme();
  const algorithm = resolved === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm;

  useLayoutEffect(() => {
    ConfigProvider.config({
      holderRender: (children) => <ConfigProvider theme={{ algorithm }}>{children}</ConfigProvider>,
    });
  }, [algorithm]);

  return <ConfigProvider theme={{ algorithm }}>{children}</ConfigProvider>;
}
