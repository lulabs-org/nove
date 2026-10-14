# 开发工作流

> 当前应用位于 `apps/admin`。本文应用命令在该目录执行；依赖统一在 Monorepo 根目录运行 `pnpm install --frozen-lockfile`，使用 pnpm 9.15.9。文档包共享根锁文件。

## 开始修改前

1. 确认需求属于哪个业务域，先阅读该 feature 的 `routes.tsx`、`api/`、类型和页面。
2. 对照后端 OpenAPI 或实际接口，不在前端自行发明字段和权限字符串。
3. 检查工作树，保留与本次任务无关的已有修改。

## 实现约定

- 页面和业务组件放在对应 `src/features/<domain>/` 下。
- 跨业务、无领域语义的能力才放入 `src/shared/`。
- `src/app/` 负责装配，不承载业务请求和领域规则。
- 权限名统一引用 `src/shared/utils/permissions.ts` 中的 `PERMISSIONS`。
- Orval 生成目录不手改；确需适配时在 feature API 层完成。
- 服务端状态通过 TanStack Query 管理；局部交互状态留在组件内，认证会话由 Zustand 管理。

## 提交前检查

```bash
pnpm generate:api
pnpm lint
pnpm test:run
pnpm build
pnpm --dir ../.. docs:build # 从 apps/admin 调用根目录文档构建
git diff --check
```

检查各自证明不同事实：lint 检查静态规则，测试检查行为，应用构建检查类型和打包，文档构建检查站点与链接。若只改文档，至少执行文档构建和 `git diff --check`。

## API 合约变化

当后端 OpenAPI 发生变化时：

```bash
pnpm generate:api
```

审查生成差异后，再调整 feature API 包装和调用方。不要把生成文件中的临时手改作为修复方案。
