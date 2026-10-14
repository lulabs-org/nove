# 路由、认证与权限

## 路由是单一导航来源

每个 feature 输出 `RouteConfig`，`src/app/routes/index.tsx` 统一聚合。`RouteConfig` 同时描述：

- `path` 与页面 `element`
- 页面标题和图标
- 是否进入菜单
- 所需读取权限
- 纯菜单分组或重定向

`menuGroup()` 创建不绑定页面的菜单目录。路由生成器会把它的子路由展平注册，同时保留侧边栏层级。

## 认证流程

1. 登录接口返回 access token。
2. access token 和用户快照由认证服务/持久化 store 保存。
3. 应用初始化时，有 token 才请求 `/api/auth/me` 恢复会话。
4. Axios 为业务请求添加 Bearer token 和 `x-request-id`。
5. 非公共认证请求返回 401 时，只发起一次共享的 refresh 请求，成功后重试原请求。
6. 刷新失败会清理会话并触发未授权事件；路由守卫随后回到登录页。

refresh token 由浏览器 Cookie 承载，请求启用 `withCredentials`。前端代码不应读取或记录 refresh token。

## 权限层次

- `ProtectedRoute`：认证与页面读取权限。
- `AdminLayout`：根据相同路由权限过滤菜单。
- `Perm`：隐藏或替换无权限的按钮/操作。
- `PermissionGuard`：需要局部区域级拦截时使用。

权限字符串集中定义在 `src/shared/utils/permissions.ts`。普通用户按权限数组检查；当前认证模型还允许超级管理员绕过显式权限列表，具体判断位于 `features/auth/model/permissions.ts`。

::: warning 安全边界
前端权限只改善导航和交互，不能代替 API 服务端鉴权。任何写操作都必须由后端再次校验。
:::

完整页面映射见[路由与权限表](/reference/routes-and-permissions)。
