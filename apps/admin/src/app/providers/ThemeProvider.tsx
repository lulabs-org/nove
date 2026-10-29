/**
 * 主题提供者。
 *
 * 只做两件事：
 * 1. 按用户偏好选 defaultAlgorithm / darkAlgorithm，交给 ConfigProvider；
 * 2. 用 ConfigProvider.config() 同步静态方法（message.* / Modal.confirm）的主题——
 *    这些方法渲染在独立的 React 根里，拿不到 Context。
 *
 * 注意：不要设置 theme.cssVar.prefix。全站 CSS 写的是 var(--ant-*)，前缀一改
 * 所有变量都会静默失效；key 由 antd 用 useId 自动生成，不需要手动设。
 */
import { useEffect, type ReactNode } from 'react';
import ConfigProvider from 'antd/es/config-provider';
import AntdApp from 'antd/es/app';
import theme from 'antd/es/theme';
import { useTheme } from './useTheme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { resolved } = useTheme();
  const algorithm = resolved === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm;

  /*
   * 静态 message / notification / Modal.confirm 渲染在独立的 React 根里，拿不到 Context。
   * 按 ConfigProvider.config() 文档给出的 holderRender 写法，用 ConfigProvider 包住静态实例——
   * 只传 theme 也能生效，但 antd 会因为缺 holderRender 打 "Static function can not
   * consume context" 的警告。
   */
  useEffect(() => {
    ConfigProvider.config({
      holderRender: (children) => <ConfigProvider theme={{ algorithm }}>{children}</ConfigProvider>,
    });
  }, [algorithm]);

  return (
    <ConfigProvider theme={{ algorithm }}>
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
}
