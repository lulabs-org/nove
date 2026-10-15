# Nove

面向组织数据与 Agent 接入的应用平台：连接会议、协作与交易数据，提供组织与权限管理、会议纪要与追踪报告、项目与文件管理、订单及分润等业务能力，通过 API 和 MCP 向管理后台、CLI 与 Agent 提供访问入口。

本仓库采用 **pnpm Workspace + Turborepo** 维护前后端应用与技能。详细的项目设计、开发指南与业务模块说明已收录于 **[Nove 统一文档中心](./docs/)**。

[项目文档](./docs/project/index.md) · [工程指南](./docs/engineering/index.md) · [API 开发](./docs/developer/api/architecture/index.md) · [Admin 开发](./docs/developer/admin/guides/getting-started.md) · [用户指南](./docs/user/index.md)

---

## 仓库组成

| 工作区             | 目录                                   | 技术栈与说明                                                                    |
| :----------------- | :------------------------------------- | :------------------------------------------------------------------------------ |
| **`@nove/api`**    | [`apps/api`](./apps/api)               | NestJS 11、Prisma 7、PostgreSQL、Redis / BullMQ；核心业务 API 与后台服务        |
| **`@nove/admin`**  | [`apps/admin`](./apps/admin)           | React 19、Vite、Ant Design、TanStack Query；管理后台界面                        |
| **`@nove/docs`**   | [`docs`](./docs)                       | VitePress；项目级文档、开发指南与架构说明                                       |
| **`@nove/skills`** | [`packages/skills`](./packages/skills) | Agent 技能与校验工具（安装方式见 [Skills README](./packages/skills/README.md)） |

## 快速开始

### 运行环境

- Node.js 22.12+ (推荐 22.23.1)
- pnpm 9.15.9

### 本地启动

```bash
# 1. 安装依赖
pnpm install --frozen-lockfile

# 2. 配置环境变量
cp apps/api/.env.example apps/api/.env
cp apps/admin/.env.example apps/admin/.env.local

# 3. 启动本地基础依赖（PostgreSQL 17 / Redis 8）
pnpm compose up -d postgres redis

# 4. 生成 Prisma 客户端并初始化数据
pnpm db:generate
pnpm prisma migrate deploy
pnpm db:seed # 仅用于本地开发环境初始化样例数据

# 5. 启动开发服务（同时启动 API 与 Admin）
pnpm dev
```

> 💡 **按需单独启动**：`pnpm dev:api`（仅 API）、`pnpm dev:admin`（仅 Admin）、`pnpm docs:dev`（仅文档站）。

### 服务入口

| 服务                  | 默认地址                                                       |
| :-------------------- | :------------------------------------------------------------- |
| **Admin 管理后台**    | `http://localhost:5173`                                        |
| **API 服务**          | `http://localhost:3000`                                        |
| **Swagger / OpenAPI** | `http://localhost:3000/api` / `http://localhost:3000/api-json` |
| **统一文档中心**      | `http://localhost:5174`                                        |

## 常用命令

| 命令                                | 说明                                                              |
| :---------------------------------- | :---------------------------------------------------------------- |
| `pnpm dev`                          | 启动 API 与 Admin 的开发服务；文档站使用 `pnpm docs:dev` 单独启动 |
| `pnpm build`                        | 编译构建 API、Admin 与文档站                                      |
| `pnpm generate:api`                 | 后端接口变动后，自动导出 OpenAPI 并生成 Admin 客户端              |
| `pnpm test`                         | 运行 API 单元测试与 Admin 测试                                    |
| `pnpm lint`                         | 代码风格与规范检查                                                |
| `pnpm docs:dev` / `pnpm docs:build` | 文档本地预览与构建检查                                            |
| `pnpm db:migrate`                   | 创建并应用新的 Prisma 迁移                                        |

完整脚本列表与交付规范请参阅 [工作区脚本说明](./docs/engineering/scripts.md) 与 [契约与交付流程](./docs/engineering/monorepo-delivery.md)。

## 文档导航

详细说明与设计规范请查阅各专题文档：

- **项目与架构**：[项目定位与系统架构](./docs/project/index.md) · [业务模块说明](./docs/developer/api/modules/index.md) · [发展路线图](./docs/roadmap/index.md)
- **后端开发**：[API 架构设计](./docs/developer/api/architecture/index.md) · [第三方服务集成](./docs/developer/api/integrations/index.md) · [API 部署指南](./docs/developer/api/guides/deployment/guide.md)
- **前端开发**：[Admin 开发入门](./docs/developer/admin/guides/getting-started.md) · [Admin 部署指南](./docs/developer/admin/guides/deployment.md)
- **工程协同**：[同仓协作与交付](./docs/engineering/monorepo-delivery.md) · [Git 协作规范](./docs/engineering/git.md) · [文档编写规范](./docs/engineering/documentation.md)
- **用户手册**：[用户指南与常见问题](./docs/user/index.md)

## 许可证

本项目采用 [MIT License](./LICENSE)。
