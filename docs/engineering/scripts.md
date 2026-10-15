# 工作区脚本

以下命令均从 Monorepo 根目录执行，以根 `package.json`、各应用 `package.json` 与 `turbo.json` 为准。要求 Node.js 22.12+、pnpm 9.15.9；CI 使用 Node.js 22.23.1。

根目录聚焦于**工作区调度、同仓契约、通用运维与跨应用开发入口**。应用专属细节（如细粒度单元测试、MCP 调试、数据表快速同步等）保留在各应用的 `package.json` 中，可通过 `pnpm --filter <包名> run <命令>` 或进入应用目录执行。

## 安装与运行

| 命令                              | 范围与作用                                  |
| --------------------------------- | ------------------------------------------- |
| `pnpm install --frozen-lockfile`  | 按根锁文件安装全部工作区依赖                |
| `pnpm dev`                        | Turbo 调度 API 与 Admin；文档站单独启动     |
| `pnpm dev:api` / `pnpm start:dev` | 仅启动 API watch 服务，默认端口 3000        |
| `pnpm dev:admin`                  | 先生成同仓契约，再启动 Admin，默认端口 5173 |
| `pnpm docs:dev`                   | 启动统一文档站，默认端口 5174               |

> API 配置位于 `apps/api/.env`，Admin 配置位于 `apps/admin/.env.local`。不要把应用环境文件放在根目录。API 生产启动请使用 `pnpm --filter @nove/api run start:prod`。

## 构建与契约

| 命令                    | 范围与作用                                 |
| ----------------------- | ------------------------------------------ |
| `pnpm build`            | Turbo 构建 API、Admin 和统一文档站         |
| `pnpm build:api`        | 生成 Prisma Client，编译 API               |
| `pnpm generate:openapi` | 编译 API 并离线导出 OpenAPI                |
| `pnpm generate:api`     | 编译 API、导出 OpenAPI、生成 Admin 客户端  |
| `pnpm build:admin`      | 自动准备契约，再进行前端类型检查与生产打包 |
| `pnpm docs:build`       | 严格检查文档链接并生成静态站点             |

Admin 根任务会自动准备契约；直接在 `apps/admin` 调用 Vite、Vitest 或构建工具前，应先运行根目录 `pnpm generate:api`。详见[同仓契约与交付流程](./monorepo-delivery.md)。

## 质量与测试

| 命令                  | 范围与作用                                             |
| --------------------- | ------------------------------------------------------ |
| `pnpm lint`           | Turbo 调度 API 和 Admin 的 lint                        |
| `pnpm lint:admin`     | 准备契约并检查 Admin                                   |
| `pnpm format`         | 写入格式化后的 API 源码、测试与 Prisma TypeScript      |
| `pnpm test`           | API 单元测试和 Admin 测试，按 Turbo 依赖准备构建与契约 |
| `pnpm test:admin`     | 准备契约、构建、lint 后执行 Admin Vitest               |
| `pnpm test:workspace` | 验证按变更选择 CI 任务的工作区测试                     |

API 与 Admin 的专用测试及检查命令（在各应用目录或通过 `--filter` 执行）：

- `pnpm --filter @nove/api run lint:prisma`：检查 API Prisma TypeScript。
- `pnpm --filter @nove/api run test:unit`：运行 API 单独单元测试。
- `pnpm --filter @nove/api run test:integration` / `test:system` / `test:e2e`：运行特定分层测试（需准备隔离数据库）。
- `pnpm --filter @nove/api run test:all` / `test:ci`：运行全部 Jest 测试；仅 `test:ci` 启用覆盖率。
- API 测试细节见[测试规范](../developer/api/guides/testing.md)，Admin 测试见[测试与质量](../developer/admin/guides/testing.md)。

## 数据库与部署

根目录保留最核心的数据库与容器编排入口：

| 命令                   | 作用                                                  |
| ---------------------- | ----------------------------------------------------- |
| `pnpm db:generate`     | 生成 Prisma Client（面向 API）                        |
| `pnpm db:migrate`      | 创建并应用开发迁移                                    |
| `pnpm db:seed`         | 写入基础种子数据（空开发库初始化）                    |
| `pnpm prisma <子命令>` | 透传调用 API 的 Prisma CLI，如 `pnpm prisma validate` |
| `pnpm compose up -d`   | 读取 `apps/api/.env` 启动 API、PostgreSQL 和 Redis    |

细粒度数据库运维建议在 `apps/api` 运行或配合 `--filter`：

- `pnpm --filter @nove/api run db:studio`：启动 Prisma Studio。
- `pnpm --filter @nove/api run db:push`：开发期直接同步 schema，不创建迁移。
- `pnpm --filter @nove/api run db:reset`：重置开发数据库并重放迁移。
- `pnpm --filter @nove/api run db:migrate:status` / `db:migrate:prod`：查看或部署迁移。

## MCP 与应用工具

API 的 MCP Inspector 调试入口属于后端专属工具，在 `apps/api` 下或通过 filter 调用：

- `pnpm --filter @nove/api run mcp:inspect`：通过 Inspector 运行编译后的 API 入口 `dist/src/main.js`。
- `pnpm --filter @nove/api run mcp:inspect:dev`：通过 Inspector 启动 Nest。
- `pnpm --filter @nove/api run mcp:inspect:sse` / `mcp:inspect:http`：连接本地运行中 API 的 `/sse` 或 `/mcp`。

应用工具优先通过 `pnpm --filter @nove/api exec <工具>` 或 `pnpm --filter @nove/admin exec <工具>` 调用。这会选择应用目录，但不会自动执行 Turbo 的契约与构建前置任务。
