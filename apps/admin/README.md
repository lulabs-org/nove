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
pnpm docs:admin:build
```

## 项目文档

完整的架构、模块、开发与部署说明位于 [`docs/`](./docs/index.md)。本地启动：

```bash
pnpm docs:admin:dev
```

## 目录边界

- `src/app/`：应用装配、布局、路由和守卫。
- `src/features/`：按业务域组织的页面、组件、API 与类型。
- `src/shared/`：无业务归属的基础设施、Hooks、类型和工具。
- `src/shared/lib/api/orval/`：由 Orval 生成，不手工修改。
- `docs/`：VitePress 项目文档。

---

## 📄 许可

本项目采用 [MIT License](./LICENSE) 开源协议。

## 迁移来源

按 [#511 方案 C](https://github.com/lulabs-org/nove-api/issues/511) 从 [nove-admin 的 4a832f2](https://github.com/lulabs-org/nove-admin/tree/4a832f211290c40fc707818624b7444d52be9c2a) 导入 v0.3.0。迁移前的提交、PR、Issue 和 blame 在原仓库查询；新变更提交至 nove-api。原仓库的只读归档交接状态见 [迁移记录](../../docs/developer/guides/collaboration/admin-migration.md)。

依赖安装会自动从 `openapi.snapshot.json` 生成 Orval 客户端，无需启动后端或提供私有配置。若使用 `--ignore-scripts` 安装，请手动执行 `pnpm --filter @nove/admin run generate:api:snapshot`。Admin 开发端口为 5173，Admin 文档端口为 5175。
