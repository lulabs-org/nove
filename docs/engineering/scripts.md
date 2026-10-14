# 工作区脚本

以下命令均从 Monorepo 根目录执行，以根 `package.json`、各应用 `package.json` 与 `turbo.json` 为准。要求 Node.js 22.12+、pnpm 9.15.9；CI 使用 Node.js 22.23.1。

## 安装与运行

| 命令 | 范围与作用 |
|---|---|
| `pnpm install --frozen-lockfile` | 按根锁文件安装全部工作区依赖 |
| `pnpm dev` | Turbo 调度 API、Admin 和统一文档站 |
| `pnpm dev:api` / `pnpm start:dev` | 仅启动 API watch 服务，默认端口 3000 |
| `pnpm dev:admin` | 先生成同仓契约，再启动 Admin，默认端口 5173 |
| `pnpm docs:dev` | 启动统一文档站，默认端口 5174 |
| `pnpm start:prod` | 运行 API 的 `apps/api/dist/src/main.js`，需先构建 |

API 配置位于 `apps/api/.env`，Admin 配置位于 `apps/admin/.env.local`。不要把应用环境文件放在根目录。

## 构建与契约

| 命令 | 范围与作用 |
|---|---|
| `pnpm build` | Turbo 构建 API、Admin 和统一文档站 |
| `pnpm build:api` | 生成 Prisma Client，编译 API |
| `pnpm generate:openapi` | 编译 API 并离线导出 OpenAPI |
| `pnpm generate:api` | 编译 API、导出 OpenAPI、生成 Admin 客户端 |
| `pnpm build:admin` | 自动准备契约，再进行前端类型检查与生产打包 |
| `pnpm docs:build` | 严格检查文档链接并生成静态站点 |

Admin 根任务会自动准备契约；直接在 `apps/admin` 调用 Vite、Vitest 或构建工具前，应先运行根目录 `pnpm generate:api`。详见[同仓契约与交付流程](./monorepo-delivery.md)。

## 质量与测试

| 命令 | 范围与作用 |
|---|---|
| `pnpm lint` | Turbo 调度 API 和 Admin 的 lint |
| `pnpm lint:admin` | 准备契约并检查 Admin |
| `pnpm lint:prisma` | 检查 API Prisma TypeScript |
| `pnpm format` | 写入格式化后的 API 源码、测试与 Prisma TypeScript |
| `pnpm format:check` | 只检查 API 的格式 |
| `pnpm test` | API 单元测试和 Admin 测试，按 Turbo 依赖准备构建与契约 |
| `pnpm test:admin` | 准备契约、构建、lint 后执行 Admin Vitest |
| `pnpm test:unit` | API Jest unit project |
| `pnpm test:integration` / `pnpm test:system` / `pnpm test:e2e` | API 对应 Jest project；需准备隔离服务 |
| `pnpm test:all` / `pnpm test:ci` | API 全部 Jest projects；后者包含覆盖率，不包含 Admin |
| `pnpm test:workspace` | 验证按变更选择 CI 任务的工作区测试 |

`lint` 脚本不带 `--fix`；`format` 会改写文件。API 测试细节见[测试规范](../developer/api/guides/testing.md)，Admin 测试见[测试与质量](../developer/admin/guides/testing.md)。

## 数据库与部署

根目录 `db:*`、`prisma` 和 `compose` 命令面向 API：

| 命令 | 作用 |
|---|---|
| `pnpm db:generate` | 生成 Prisma Client |
| `pnpm prisma validate` | 校验 Prisma schema |
| `pnpm db:migrate` | 创建并应用开发迁移 |
| `pnpm db:migrate:status` | 查看迁移状态 |
| `pnpm db:migrate:prod` | 应用已有迁移 |
| `pnpm db:studio` | 启动 Prisma Studio |
| `pnpm db:push` | 开发期直接同步 schema，不创建迁移 |
| `pnpm db:reset` | 删除数据并重放迁移，仅用于可重建的开发数据库 |
| `pnpm db:seed` / `pnpm db:seed:real` | 写入种子数据，后者携带 `--real` |
| `pnpm db:backup` | 执行 API 的备份脚本 |
| `pnpm compose up -d` | 读取 `apps/api/.env` 启动 Compose 服务 |

迁移、重置和种子操作前检查目标数据库；共享或生产数据库不能用于测试。部署分别参见 [API 部署](../developer/api/guides/deployment/overview.md)与 [Admin 部署](../developer/admin/guides/deployment.md)。

## MCP 与应用工具

- `pnpm mcp:inspect`：通过 Inspector 运行编译后的 API 入口 `dist/src/main.js`。
- `pnpm mcp:inspect:dev`：通过 Inspector 启动 Nest。
- `pnpm mcp:inspect:sse` / `pnpm mcp:inspect:http`：连接本地 API 的 `/sse` 或 `/mcp`。

应用工具优先通过 `pnpm --filter @nove/api exec <工具>` 或 `pnpm --filter @nove/admin exec <工具>` 调用。这会选择应用目录，但不会自动执行 Turbo 的契约与构建前置任务。
