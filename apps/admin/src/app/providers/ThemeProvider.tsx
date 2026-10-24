/**
 * 主题提供者。
 *
 * 只做三件事：
 * 1. 按用户偏好 + 系统偏好选 defaultAlgorithm / darkAlgorithm，交给 ConfigProvider；
 * 2. 用 ConfigProvider.config() 同步静态方法（message.* / Modal.confirm）的主题——
 *    这些方法渲染在独立的 React 根里，拿不到 Context；
 * 3. 把生效模式与少量基础色写到 <html>，供 body、原生控件和首帧脚本使用。
 *
 * 注意：不要设置 theme.cssVar 的 prefix / key。全站的 var(--ant-*) 与
 * `.css-var-root{...}` 规则都绑定默认值，改了会导致所有变量静默失效。
 */
import { useEffect, useMemo, type ReactNode } from 'react';
import ConfigProvider from 'antd/es/config-provider';
import AntdApp from 'antd/es/app';
import theme from 'antd/es/theme';
import type { ResolvedTheme } from './themeStore';
import { useTheme } from './useTheme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { resolved } = useTheme();
  const algorithm = resolved === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm;

  /*
   * 暗色下 antd 把选中项的底色设为 colorPrimaryBg，文字仍用 colorPrimary，
   * 两者在暗色调色板里亮度接近，实测对比度只有 2.47:1。改用白色文字保住可读性，
   * 选中身份由底色承担。亮色保持 antd 默认。
   */
  const components = useMemo(() => {
    if (resolved !== 'dark') return undefined;
    const dark = theme.getDesignToken({ algorithm: theme.darkAlgorithm });
    return {
      Menu: {
        itemSelectedColor: dark.colorTextLightSolid,
        itemSelectedBg: dark.colorPrimaryBg,
      },
    };
  }, [resolved]);

  // 静态 message / notification / Modal.confirm 不经过 Context，只能走全局配置。
  useEffect(() => {
    ConfigProvider.config({ theme: { algorithm, components } });
  }, [algorithm, components]);

  return (
    <ConfigProvider theme={{ algorithm, components }}>
      <AntdApp>
        <ThemeChrome themeKey={resolved} />
        {children}
      </AntdApp>
    </ConfigProvider>
  );
}

/**
 * 把生效主题写到 document 上。
 *
 * `--ant-*` 只声明在 antd 组件根节点上，<html> / <body> 取不到，所以 body 的底色
 * 必须由 JS 写入具体值；`data-theme` 供首帧脚本与少量仅靠 CSS 无法表达的覆盖使用。
 */
function ThemeChrome({ themeKey }: { themeKey: ResolvedTheme }) {
  const { token } = theme.useToken();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = themeKey;
    root.style.colorScheme = themeKey;
    root.style.backgroundColor = token.colorBgLayout;
    document.body.style.backgroundColor = token.colorBgLayout;
    document.body.style.color = token.colorText;
  }, [themeKey, token]);

  return null;
}
