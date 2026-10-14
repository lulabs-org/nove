# 架构概览

Nove Admin 是一个 React 单页应用。源码采用“应用装配层 + 业务域 + 共享基础设施”的组织方式。

```text
src/
├── app/       # Provider、路由、守卫、布局与菜单装配
├── features/  # 按业务域组织的页面、组件、API 和模型
├── shared/    # HTTP、Hooks、通用类型、路由/权限工具
├── test/      # 全局测试初始化
└── main.tsx   # 浏览器入口
```

## 依赖方向

```text
main.tsx → app → features → shared
              ↘────────────→ shared
```

- `app` 可以聚合 feature，但不实现领域业务。
- feature 可以依赖 shared；feature 间依赖应保持少量且显式。
- shared 不依赖具体业务模块。当前 HTTP 层为处理认证刷新而引用了 `features/auth/api/service`，这是现存例外，扩展共享层时不要继续扩大该方向。
- 每个 feature 通过 `index.ts` 暴露给路由聚合层的最小公共入口。

## 运行时装配

`src/main.tsx` 渲染应用，`AppProviders` 创建全局 `QueryClient` 和浏览器路由。路由树由各 feature 的配置聚合后生成：公共登录页使用 `PublicLayout`，其余页面放入 `ProtectedRoute` 与 `AdminLayout`。

`AdminLayout` 使用同一份 `RouteConfig` 生成侧边栏和面包屑，因此页面路径、菜单标题和访问权限应在 feature 的路由文件中维护，不另建重复菜单表。

## 技术栈职责

- React 19：组件与界面组合。
- React Router 7：页面路由、重定向和嵌套路由。
- Ant Design 6：后台 UI 基础组件。
- TanStack Query 5：服务端数据获取、缓存和失效。
- Zustand：登录用户和认证状态。
- Axios：统一请求、刷新令牌和错误处理。
- React Hook Form + Zod：复杂表单和校验（按模块需要使用）。
- Orval：根据 Nove API OpenAPI 生成类型与 React Query 客户端。
