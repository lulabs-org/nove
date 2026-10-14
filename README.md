# Nove

面向组织数据与 Agent 接入的应用平台：连接会议、协作与交易数据，提供组织与权限管理、会议纪要与追踪报告、项目与文件管理、订单及分润等业务能力，通过 API 和 MCP 向管理后台、CLI 与 Agent 提供访问入口。

本仓库使用 **pnpm Workspace + Turborepo**，统一维护后端 API、Admin 管理后台、Agent 技能和项目文档。前后端通过同仓 OpenAPI 生成客户端，共用锁文件与 CI，应用依赖和环境配置分别管理。

[项目文档](./docs/project/index.md) · [工程指南](./docs/engineering/index.md) · [API 开发](./docs/developer/api/architecture/index.md) · [Admin 开发](./docs/developer/admin/guides/getting-started.md) · [用户指南](./docs/user/index.md)

> 原 [nove-admin](https://github.com/lulabs-org/nove-admin)、[nove-doc](https://github.com/lulabs-org/nove-doc) 和 [nove-skills](https://github.com/lulabs-org/nove-skills) 的内容统一迁入本仓库维护。新的开发、文档修改、Issues 和 PR 请提交到 **nove**；旧仓库保留历史代码与讨论。

## 仓库组成

| 工作区         | 位置                                   | 职责与技术栈                                                                            |
| -------------- | -------------------------------------- | --------------------------------------------------------------------------------------- |
| `@nove/api`    | [`apps/api`](./apps/api)               | NestJS 11、Prisma 7、PostgreSQL、Redis / BullMQ；业务 API、后台任务与第三方集成         |
| `@nove/admin`  | [`apps/admin`](./apps/admin)           | React 19、Vite、Ant Design、TanStack Query；组织、业务与系统管理界面                    |
| `@nove/docs`   | [`docs`](./docs)                       | VitePress；项目级文档、API/Admin 开发指南、工程协作和路线图                             |
| `@nove/skills` | [`packages/skills`](./packages/skills) | Agent 技能、API 参考与技能校验；安装方式见 [Skills README](./packages/skills/README.md) |

[Nove CLI](https://github.com/lulabs-org/nove-cli) 继续在独立仓库维护。技能校验运行 `pnpm skills:check`，校验器测试运行 `pnpm skills:test`。

## 业务模块

- **身份与组织**：用户、组织成员、部门、角色与权限，JWT、API Key 和 OAuth 接入。
- **会议与报告**：会议记录、转写、纪要、参会者总结与追踪报告。
- **项目与资产**：项目、Drive 文件管理、技能及版本管理。
- **交易与结算**：产品、渠道、订单、退款、分润记录与工资条。
- **服务集成**：腾讯会议、飞书、企业微信、Stripe、微信小店、邮件、短信及模型调用等集成模块。

具体接口与配置以[业务模块文档](./docs/developer/api/modules/index.md)、[第三方集成文档](./docs/developer/api/integrations/index.md)及当前源码为准。[项目文档](./docs/project/index.md)保留迁入资料的来源时间；[路线图](./docs/roadmap/index.md)中的目标和方案不等同于已实现功能。

## 快速开始

以下命令均在仓库根目录执行。

### 1. 安装工作区依赖

使用 Node.js 22.12+（建议与 CI 一致使用 **22.23.1**）和 **pnpm 9.15.9**。

```bash
git clone https://github.com/lulabs-org/nove.git
cd nove
pnpm install --frozen-lockfile
```

只在根目录安装依赖，所有工作区共用 `pnpm-lock.yaml`。

### 2. 只阅读或维护文档

```bash
pnpm docs:dev
```

访问 `http://localhost:5174`。文档开发与构建无需启动 API、PostgreSQL 或 Redis；提交前运行 `pnpm docs:build` 检查站内链接并生成静态页面。

### 3. 启动 API 与 Admin

首次配置本地开发环境：

```bash
cp apps/api/.env.example apps/api/.env
cp apps/admin/.env.example apps/admin/.env.local
```

编辑配置后再启动服务：

- `apps/api/.env`：配置 PostgreSQL、Redis、认证与加密密钥等，替换示例占位值。完整字段见 [API 环境示例](./apps/api/.env.example)。
- `apps/admin/.env.local`：设置 `VITE_API_BASE_URL=http://localhost:3000`，或指向已有的 API 实例。`VITE_` 变量会进入浏览器，不能放置私有密钥。
- 本地前端默认使用 5173 端口；API 的 `NOVE_ADMIN_URL` 与 `CORS_ORIGINS` 应与实际前端地址一致。

可使用已有的 PostgreSQL / Redis，或仅启动仓库中的基础服务（Docker Compose 使用 PostgreSQL 17、Redis 8）：

```bash
pnpm compose up -d postgres redis
```

连接到**本地开发数据库**，生成 Prisma Client 并应用仓库已有的迁移：

```bash
pnpm db:generate
pnpm prisma migrate deploy

# 仅用于新的本地开发数据库：初始化组织、权限、测试用户及业务样例
pnpm db:seed
```

当前运行时要求数据库中恰好有一个启用且未删除的组织，空数据库需要先初始化基础数据；默认种子为 mock 数据。初始化流程见[数据库种子入口](./apps/api/prisma/seed.ts)，不要将本地示例初始化步骤直接用于生产数据库。

```bash
# 同时启动 API、Admin 与文档站
pnpm dev

# 也可在独立终端中按需启动
pnpm dev:api
pnpm dev:admin
pnpm docs:dev
```

| 服务                   | 默认地址                                                       |
| ---------------------- | -------------------------------------------------------------- |
| API                    | `http://localhost:3000`                                        |
| Admin                  | `http://localhost:5173`                                        |
| 统一文档站             | `http://localhost:5174`                                        |
| Swagger / OpenAPI JSON | `http://localhost:3000/api` / `http://localhost:3000/api-json` |
| ReDoc 接口文档         | `http://localhost:3000/docs`                                   |

Admin 可以单独连接已有 API；其开发、构建、lint 和测试入口会先准备同仓契约。离线契约生成无需启动后端服务，但登录和业务操作需要可访问的 API。

## 前后端契约与常用命令

修改后端接口或 DTO 后，运行：

```bash
pnpm generate:api
```

Turbo 按顺序执行 **API 编译 → OpenAPI 离线导出 → Orval 客户端生成**。规范位于 `apps/api/openapi/openapi.json`，客户端位于 `apps/admin/src/shared/lib/api/orval/`；两者均为生成产物，不手工修改或提交。开发进程运行期间修改接口后，需再次执行生成命令。

| 命令                                      | 用途                                                             |
| ----------------------------------------- | ---------------------------------------------------------------- |
| `pnpm build`                              | 构建 API、Admin 和文档站                                         |
| `pnpm build:api` / `pnpm build:admin`     | 构建指定应用；Admin 自动准备契约                                 |
| `pnpm generate:openapi`                   | 只编译 API 并导出 OpenAPI 规范                                   |
| `pnpm docs:build`                         | 构建统一文档站并检查站内链接                                     |
| `pnpm lint`                               | 检查 API 与 Admin 代码                                           |
| `pnpm --filter @nove/api run lint:prisma` | 检查 API Prisma TypeScript                                       |
| `pnpm test`                               | 运行 API 单元测试和 Admin Vitest 测试                            |
| `pnpm test:admin`                         | 运行 Admin 测试及其构建、lint 前置任务                           |
| `pnpm test:workspace`                     | 验证 CI 按 Git 变更范围选择任务的逻辑                            |
| `pnpm --filter @nove/api run test:all`    | 运行 API 单元、集成、系统和 E2E 测试，需准备隔离测试数据库等服务 |
| `pnpm db:migrate`                         | 在开发数据库创建并应用新的 Prisma 迁移                           |

应用级工具使用 `pnpm --filter @nove/api exec <工具>` 或 `pnpm --filter @nove/admin exec <工具>`。直接运行 Admin 包内工具前，先从根目录执行 `pnpm generate:api`。完整说明见[工作区脚本](./docs/engineering/scripts.md)与[契约和交付流程](./docs/engineering/monorepo-delivery.md)。

## 目录与文档入口

```text
apps/
├── api/                 # NestJS 源码、Prisma、测试、维护脚本与后端配置
└── admin/               # React 源码、前端测试与浏览器配置
docs/
├── project/             # 项目定位、整体架构、安全方案和合作方
├── developer/api/       # 后端架构、模块、集成与开发指南
├── developer/admin/     # 前端架构、模块与开发指南
├── engineering/         # 同仓协作、契约、脚本、文档规范与迁移记录
├── user/                # 用户操作、接口接入与 FAQ
└── roadmap/             # 项目路线图、目标与提案
Dockerfile               # API 生产镜像
Dockerfile.admin         # Admin 静态镜像
docker-compose.yml       # API、PostgreSQL、Redis 服务编排
pnpm-workspace.yaml      # 工作区声明（预留 packages/*，尚无共享业务包）
pnpm-lock.yaml           # 全仓库锁文件
turbo.json               # 任务依赖与缓存
```

- 了解项目：[项目文档](./docs/project/index.md)、[规划与提案](./docs/roadmap/index.md)。
- 参与开发：[工程指南](./docs/engineering/index.md)、[Git 协作规范](./docs/engineering/git.md)、[文档维护指南](./docs/engineering/documentation.md)。
- 查阅实现：[API 开发文档](./docs/developer/api/architecture/index.md)、[Admin 开发文档](./docs/developer/admin/guides/getting-started.md)、[用户指南](./docs/user/index.md)。
- 查询迁移来源：[Admin 迁移记录](./docs/engineering/migrations/admin.md)、[项目文档迁移记录](./docs/engineering/migrations/nove-doc.md)。两个旧仓库均已归档，迁移前的提交、Issues 和 PR 留在原仓库查询。

## CI 与部署

向 `main` 提交 PR。CI 按整个 PR 的变更范围选择任务：API 变化同时验证 Admin 契约兼容性，Admin 变化检查前端，文档变化构建文档站，公共构建配置变化进行完整验证。应用受影响时还会执行对应的 Docker 镜像构建验证。

两端镜像均从仓库根目录构建：

```bash
docker build -t nove-api .
docker build -f Dockerfile.admin \
  --build-arg VITE_API_BASE_URL=https://api.example.com \
  -t nove-admin .
```

API 使用 `turbo prune` 裁剪依赖，运行镜像包含后端生产依赖与编译产物；Admin 由非 root Nginx 提供静态文件，监听 8080 端口，API 地址在构建时注入。文档站产物为 `docs/.vitepress/dist/`，可部署到静态托管平台。

后端镜像发布由现有 GitHub Actions 工作流负责；Admin 与文档站的托管、域名和环境配置按部署环境管理。仓库归档不会自动切换旧站点的部署关联或域名。详见 [API 部署指南](./docs/developer/api/guides/deployment/guide.md)、[Admin 部署指南](./docs/developer/admin/guides/deployment.md)和[统一交付流程](./docs/engineering/monorepo-delivery.md)。

## 许可证

本项目采用 [MIT License](./LICENSE)。迁入的项目文档原许可证保留于 [docs/project/license.md](./docs/project/license.md)。
