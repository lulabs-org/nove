<h1 align="center">Nove API (Core Service)</h1>

<p align="center">
  <b>Nove 生态系统</b>的核心后端服务。为 <b>Nove Admin (管理后台)</b>、<b>Nove CLI (命令行工具)</b> 以及第三方接入提供坚实可靠的底层 API 支撑。
</p>
<p align="center">
  基于 NestJS 构建，提供企业级多租户架构、OAuth2 授权体系、组织与用户管理、会议记录及智能化统计分析；并具备强大的第三方音视频服务、企业协同办公套件及 AI 大模型能力的深度集成方案。
</p>

<p align="center">
  <img alt="NestJS" src="https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript">
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql">
  <img alt="Redis" src="https://img.shields.io/badge/Redis-BullMQ-DC382D?logo=redis">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-green">
</p>

---

## ✨ 核心特性

- **🏢 企业级架构**：基于 NestJS 构建，采用模块化设计，内置强大的依赖注入和控制反转机制，保障代码的高可维护性。
- **🔐 完善的身份认证**：内置 OAuth2 服务端能力，支持多渠道登录、JWT 鉴权及灵活的 API Key 机制。
- **👥 多租户与权限控制**：支持复杂的组织架构映射，提供细粒度的 RBAC/ABAC 权限管理。
- **🧩 深度集成能力**：架构设计上充分考虑了外部系统扩展，支持无缝对接各大主流音视频会议平台、企业协同办公软件及领先的 AI 大模型服务。
- **🚀 高性能与高可用**：采用 PostgreSQL 作为主数据库，结合 Prisma ORM 保证数据访问类型安全；结合 Redis 与 BullMQ 提供强大的异步任务调度与队列处理能力。

---

## 📚 项目文档

Nove API 的所有文档（包括架构设计、API 参考、开发指南、第三方集成说明等）已迁移并整合为 [完整的文档站点](./docs)。

- [**👨‍💻 工程指南**](./docs/engineering/index.md) - 同仓契约生成、协作、测试和部署流程。
- [**API 开发文档**](./docs/developer/api/architecture/index.md) - 后端架构、业务模块与第三方集成。
- [**👤 用户文档**](./docs/user/index.md) - 面向系统最终用户与 API 调用方，包含如何使用系统功能、API 接口指引、常见问题等。
- [**🖥️ Admin 开发文档**](./docs/developer/admin/guides/getting-started.md) - 管理后台的架构、模块、开发与部署。
- [**📖 完整文档目录**](./docs/index.md) - 浏览所有文档入口。

> **提示**：您也可以在本地运行以下命令启动文档站点：
>
> ```bash
> pnpm install --frozen-lockfile
> pnpm docs:dev
> ```
>
> 随后访问 `http://localhost:5174` 即可获得最佳的阅读体验。

---

## 工作区结构

本仓库已完成 Monorepo 的工作区初始化、后端迁移和 Admin 导入，并接入同仓契约生成、按变更验证和独立容器构建（Issue #510 阶段 1–5 的代码实现）：

```text
apps/api/           # @nove/api：NestJS 源码、Prisma、测试、脚本与独立依赖
  src/ prisma/ test/ scripts/
  .env.example      # 复制为同目录的 .env，勿放在根目录
  package.json
  tsconfig.json
apps/admin/         # @nove/admin：React 管理后台
docs/               # @nove/docs：API 与 Admin 统一 VitePress 文档站
  developer/admin/  # Admin 架构、模块、开发与部署文档
packages/           # 工作区已预留匹配规则，尚无共享包
package.json        # 根任务入口和公共开发工具
pnpm-lock.yaml      # 工作区安装使用的锁文件
pnpm-workspace.yaml
tsconfig.base.json  # 通用编译选项；Node/DOM 与路径配置由应用各自维护
turbo.json          # 构建缓存及任务调度
```

根目录运行 `pnpm dev` / `pnpm build` 会调度当前 API、Admin 与统一文档站；`pnpm dev:api` / `pnpm build:api` 只操作后端，`pnpm dev:admin` / `pnpm build:admin` 只操作前端。`pnpm lint` / `pnpm test` 调度应用对应任务，默认测试为 API 单元测试和 Admin 测试；API 集成/E2E 使用 `pnpm test:all` 并准备隔离数据库等服务。Admin 任务自动先生成最新契约。

根目录的 `start:*`、`db:*`、`test:*` 等原有命令继续转发给 API。需要直接调用应用工具时，使用 `pnpm --filter @nove/api exec <工具>`，例如 `pnpm --filter @nove/api exec jest --selectProjects unit --runInBand`。维护脚本从 `apps/api` 执行，Docker 构建脚本会自动定位仓库根目录。

构建缓存包含 API 的 `dist`、生成的 Prisma Client 和文档站输出；修改公共 TS/格式配置会使缓存失效。带外部依赖的测试、lint 和开发进程不缓存，dev/test 保留注入的运行环境变量。

从旧目录升级时，将本地 `.env`、`.env.test` 和其他 API 私有配置迁至 `apps/api/`，重新运行 `pnpm install --frozen-lockfile`。如使用相对路径的运行数据（例如 `temp-data`），也应迁至应用目录。Docker Compose 使用 `pnpm compose up -d`，统一读取 `apps/api/.env`。Admin 配置独立保存在 `apps/admin/.env.local`（从同目录 `.env.example` 复制），通过 `VITE_API_BASE_URL` 指向后端。

Admin 按 #511 方案 C 从 `lulabs-org/nove-admin` 的 `4a832f211290c40fc707818624b7444d52be9c2a` 单点导入，历史提交继续在原仓库查询。详见 [Admin 迁移记录](./docs/engineering/migrations/admin.md)。`pnpm generate:api` 会编译 API、离线导出 OpenAPI，再生成 Admin 客户端；无需启动服务或提供私有配置。CI 使用 PR 完整差异或 push 前后差异选择任务，API 改动也验证 Admin。API 和 Admin 分别通过 `Dockerfile`、`Dockerfile.admin` 构建。详见 [契约与交付工作流](./docs/engineering/monorepo-delivery.md)。

---

## 🚀 快速开始

如果想马上启动后端服务，请参考以下精简步骤。详细步骤请参考 [环境配置与部署指南](./docs/developer/api/guides/deployment/guide.md)：

### 1. 环境准备

- Node.js 22.12+（CI 使用 22.23.1）
- pnpm 9.15.9
- PostgreSQL 14+
- Redis 6+

### 2. 安装与配置

```bash
# 1. 安装依赖
pnpm install --frozen-lockfile

# 2. 配置环境变量
cp apps/api/.env.example apps/api/.env
# 请在 apps/api/.env 中填入 DATABASE_URL、REDIS_URL 等必要配置

# 3. 初始化数据库结构
pnpm db:generate
pnpm db:push
```

### 3. 启动服务

```bash
# 启动开发服务器（支持热重载）
pnpm start:dev
```

启动成功后可访问以下本地服务：

- **Swagger API 接口文档**: `http://localhost:3000/api`
- **GraphQL 调试面板 (Playground)**: `http://localhost:3000/graphql`

---

## 📄 许可

本项目采用 [MIT License](./LICENSE) 开源协议。
