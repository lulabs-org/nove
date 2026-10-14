# Admin 工作区迁移记录

本次实现 [#510 第三阶段](https://github.com/lulabs-org/nove-api/issues/510)，采用 [#511 方案 C](https://github.com/lulabs-org/nove-api/issues/511)：导入当前源码快照，保留原 API 历史，迁移前的 Admin 历史在原仓库查询。

## 来源与边界

- 来源仓库：[`lulabs-org/nove-admin`](https://github.com/lulabs-org/nove-admin)
- 来源分支：`main`
- 固定提交：[`4a832f211290c40fc707818624b7444d52be9c2a`](https://github.com/lulabs-org/nove-admin/commit/4a832f211290c40fc707818624b7444d52be9c2a)
- 来源版本：`0.3.0`
- 目标目录：`apps/admin`，工作区包名 `@nove/admin`
- 导入方式：从该提交的 Git tree 导出跟踪文件；不引入旧提交、merge parent 或嵌套 `.git`，不改写已有 API 提交。

源码、静态资源、测试、许可证、环境示例、Orval、Vite、Playwright 和应用级代码规范配置均保留。Admin 文档保留在 `apps/admin/docs`，作为 `@nove/admin-docs` 加入工作区。

清理了独立仓库的 `.husky`、`.trae`、commitlint、lint-staged、`prepare` hook、`pnpm-workspace.yaml` 及嵌套锁文件。未导入私有 `.env`、未跟踪文件、node_modules、dist、缓存或部署凭据。API 和两套文档站也统一使用根 `pnpm-lock.yaml`。

## 使用方式

从工作区根目录执行：

```bash
pnpm install --frozen-lockfile
cp apps/admin/.env.example apps/admin/.env.local
pnpm dev:admin
pnpm build:admin
pnpm lint:admin
pnpm test:admin
pnpm docs:admin:build
```

`pnpm dev` 调度 API（3000）、Admin（5173）、API 文档（5174）和 Admin 文档（5175）；需要单应用或固定端口时使用各自的根入口。Admin 的 `test` 为单次运行，监听模式使用 `pnpm --filter @nove/admin run test:watch`。

Admin 的 `VITE_API_BASE_URL` 在构建时写入静态产物。Turbo 会把 `VITE_*` 环境变量和应用的生产环境文件纳入 Admin 构建缓存，避免不同 API 地址复用错误产物。前端的 DOM/ESM 设置独立保留，仅继承公共 TS 基础选项。

`pnpm generate:api` 已转发到现有 Orval 入口，默认使用冻结快照，也可通过 `ORVAL_API_TARGET` 指定输入。为修复原仓库忽略生成客户端导致干净构建失败的问题，新增 `openapi.snapshot.json`。该快照来自 2026-10-13 阶段 1–2 验证实例的 `/api-json`（API 提交 `6ed4a204b4d8aa9a9c2f567e88fe4b44ca674975`），已确认当前 API 基线 `20d0c09b68ec12e37f1fe6856f0b6443af5e9b00` 的源码与 Prisma Schema 完全一致。

安装时 `postinstall` 固定使用快照生成客户端，不读取远程规范。若安装时禁用了脚本，手动运行 `pnpm --filter @nove/admin run generate:api:snapshot`。生成目录继续忽略，不提交手改文件。该快照只是迁移构建基线，同仓 OpenAPI 自动导出与更新链路属于阶段 4。

## 构建兼容修正

对冻结契约完成三项最小修正：权限测试补齐必填 `action`；平台枚举补齐企业微信标签；平台用户详情/更新响应中的头像字段在适配层收窄为字符串或空值，并补充四个回归用例。Vitest 限制为两个 worker，并将 CI 中单个测试的超时设为 15 秒，适配共享 runner 上的完整 Ant Design 交互；本地保持默认 5 秒，保留全部断言和错误检查。

## 旧仓库归档与交接

迁移检查时原仓库仍未归档，并有以下未合并 PR：

- [#196](https://github.com/lulabs-org/nove-admin/pull/196)：分账工资条上下文与零数据分析
- [#188](https://github.com/lulabs-org/nove-admin/pull/188)：云盘媒体预览
- [#186](https://github.com/lulabs-org/nove-admin/pull/186)：暗色模式
- [#184](https://github.com/lulabs-org/nove-admin/pull/184)：认证初始化和加载状态
- [#173](https://github.com/lulabs-org/nove-admin/pull/173)：组织成员搜索
- [#168](https://github.com/lulabs-org/nove-admin/pull/168)：搜索框修复

这些 PR 的未合并改动不属于本次主干快照，不能视为已迁入。按第三阶段要求，集成验证完成后将旧仓库归档为只读；未合并工作保留在原 PR 中，后续需在 Monorepo 重新提交。归档不会关闭或合并这些 PR，也不会自动切换 Vercel 项目、域名或环境变量。归档的实际执行状态以本次集成 PR 的交付说明为准。

归档后，旧 commit、PR 和 Issue 继续保留用于历史查询；新开发应提交至 Monorepo。#510 的阶段 4–5 尚待实施，因此本次 PR 仅使用引用，不自动关闭整体 Issue。
