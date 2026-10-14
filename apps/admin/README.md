# Nove Admin

Nove 的组织管理后台，基于 React、TypeScript、Vite、Ant Design 和 TanStack Query 构建。

## 开始开发

要求：Node.js 22.12+、pnpm 9.15.9，以及可访问的 Nove API。

```bash
# 从 Monorepo 根目录执行
pnpm install --frozen-lockfile
cp apps/admin/.env.example apps/admin/.env.local
pnpm dev:admin
```

在 `apps/admin/.env.local` 中配置：

```dotenv
VITE_API_BASE_URL=http://localhost:3000
```

常用检查：

```bash
pnpm lint:admin
pnpm test:admin
pnpm build:admin
pnpm docs:build
```

## 项目文档

完整的架构、模块、开发与部署说明位于 [`docs/developer/admin/`](../../docs/developer/admin/guides/getting-started.md)。本地启动：

```bash
pnpm docs:dev
```

## 目录边界

- `src/app/`：应用装配、布局、路由和守卫。
- `src/features/`：按业务域组织的页面、组件、API 与类型。
- `src/shared/`：无业务归属的基础设施、Hooks、类型和工具。
- `src/shared/lib/api/orval/`：由 Orval 生成，不手工修改。

---

## 📄 许可

本项目采用 [MIT License](./LICENSE) 开源协议。

## 迁移来源

按 [#511 方案 C](https://github.com/lulabs-org/nove-api/issues/511) 从 [nove-admin 的 4a832f2](https://github.com/lulabs-org/nove-admin/tree/4a832f211290c40fc707818624b7444d52be9c2a) 导入 v0.3.0。迁移前的提交、PR、Issue 和 blame 在原仓库查询；新变更提交至 nove-api。原仓库的只读归档交接状态见 [迁移记录](../../docs/engineering/migrations/admin.md)。

从 Monorepo 根目录运行 `pnpm generate:api`，即可编译同仓 API、离线导出 OpenAPI 并生成客户端，无需在线服务。根目录的 Admin 开发、构建、lint 和测试命令会自动准备契约。直接在应用目录调用 Vite、Vitest 或 `pnpm build` 前，请先运行 `pnpm generate:api`。Admin 开发端口为 5173，统一文档站端口为 5174。
