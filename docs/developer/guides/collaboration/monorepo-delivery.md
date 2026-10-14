# Monorepo 契约与交付工作流

## 同仓契约生成

在工作区根目录运行：

```bash
pnpm install --frozen-lockfile
pnpm generate:api
pnpm build:admin
pnpm test:admin
```

Turbo 顺序执行 `@nove/api#build` → `@nove/api#generate:openapi` → `@nove/admin#generate:client`，随后运行前端任务。后端改动使契约与客户端缓存失效；缓存同时恢复 OpenAPI 和生成客户端。只需规范文件时运行 `pnpm generate:openapi`。

导出使用与在线 Swagger 相同的 `createSwaggerDocument`，读取真实 AppModule，并使用 [Nest 预览模式](https://docs.nestjs.com/devtools/ci-cd-integration) 跳过构造函数、生命周期和外部连接，不监听端口。导出入口在加载 AppModule 前设置 `OPENAPI_EXPORT=true`，避免 ConfigModule 读取私有 `.env`。该标志仅供导出命令内部使用。

规范写入 `apps/api/openapi/openapi.json`，客户端写入 `apps/admin/src/shared/lib/api/orval`；两者都是忽略的生成产物，禁止手改。阶段 3 的冻结快照及其 postinstall 已删除。Orval 输入固定为同仓文件，避免远程服务状态或开发者配置影响缓存结果。

根目录的 Admin build、dev、lint、test 都会先准备契约；直接调用应用内工具前需先运行 `pnpm generate:api`。开发进程启动后修改后端 DTO，应再次运行生成命令，再检查调用方。`pnpm test` 默认跑 API 单元测试和 Admin Vitest；API 全量集成/E2E 使用 `pnpm test:all`。

## 按变更选择 CI

CI 始终产生同名 `ci` 检查，不使用工作流级路径过滤，避免必需检查一直 pending。`scripts/ci-scope.mjs` 使用 PR base/head 的 merge-base，或 push before/head，覆盖一个 PR 内所有提交；缺少历史或首次 push 时完整验证。

基于 [Turbo Git 范围过滤](https://turborepo.dev/docs/reference/run) 选择任务：

- API 变化：运行 API 和 Admin 的契约兼容性检查。
- Admin 变化：检查 Admin；API 编译/导出作为构建依赖，跳过 API 测试和数据库检查。
- 文档变化：仅构建对应文档站。
- 根依赖、公共配置、CI 脚本、Docker 或部署配置变化：完整验证。

任务过滤额外包含 API 契约的 Admin 消费方，因为它们以任务依赖连接，而非浏览器的 package 依赖。8 个临时 Git 仓库回归用例覆盖前后端、两套文档、全局配置、多提交 PR、空差异和缺少历史。运行 `pnpm test:workspace` 验证。

CI 通过 `turbo run lint lint:prisma format:check test build --concurrency=2` 调度任务。API lint/test 等待编译和 Prisma 生成结束，避免并行读写生成类型。Admin 测试等待自身构建和 lint 完成，CI 内限制一个 Vitest worker，控制并发资源占用。数据库迁移与 PostgreSQL 兼容性测试只在 API 受影响时运行。应用受影响时额外验证对应 Docker 镜像，PR 构建不推送镜像。

## 独立镜像

```bash
# 后端，仓库根作为上下文
 docker build -t nove-api .
# 前端，API 地址为公开的构建参数
 docker build -f Dockerfile.admin --build-arg VITE_API_BASE_URL=https://api.example.com -t nove-admin .
 docker run --rm -p 8080:8080 nove-admin
```

API 使用 [turbo prune --docker](https://turborepo.dev/docs/reference/prune) 裁剪依赖；生产依赖在独立阶段安装，最终只复制生产 node_modules、API dist 和 package.json，不包含 Admin、测试工具或完整源码。

Admin 同时裁剪 API 与 Admin，因为构建客户端需要后端元数据。最终 Nginx 镜像只含静态资源，以非 root 用户监听 8080，支持 SPA 深层路由，缺失资源返回 404。必须提供 `VITE_API_BASE_URL`，不在镜像中传入数据库凭据或私有配置。

现有后端 GHCR 发布保留分支/tag规则，普通分支推送只在后端或构建依赖变化时触发。Admin 镜像提供独立构建入口；实际托管平台、域名、环境变量和上线切换仍由部署流程配置。旧 Admin 仓库归档的状态参见 [迁移记录](./admin-migration.md)。
