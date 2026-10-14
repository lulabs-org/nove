import type { RouteConfig } from '../types';

/**
 * 创建一个纯粹的菜单分组节点。
 * 该节点仅用于在左侧导航栏展示为一个可展开的目录（不绑定实际页面），
 * 内部会自动补充空组件和必要的菜单标记。
 *
 * @param path 路由路径，作为该目录的唯一标识前缀
 * @param title 菜单上显示的标题
 * @param icon 菜单栏的图标
 * @param children 挂载在该目录下的子路由数组
 * @returns 标准化的路由配置对象
 */
export const menuGroup = (
  path: string,
  title: string,
  icon: React.ReactElement,
  children: RouteConfig[]
): RouteConfig => ({
  path,
  element: <></>,
  menuOnly: true,
  title,
  menu: true,
  icon,
  children,
});
