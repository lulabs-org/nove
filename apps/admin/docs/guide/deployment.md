# 部署

> 当前应用位于 `apps/admin`。本文应用命令在该目录执行；依赖统一在 Monorepo 根目录运行 `pnpm install --frozen-lockfile`，使用 pnpm 9.15.9。文档包共享根锁文件。

## 生产构建

```bash
pnpm install --frozen-lockfile
pnpm build
```

应用产物位于 `dist/`。构建时必须提供正确的 `VITE_API_BASE_URL`；Vite 环境变量会写入前端产物，不应放置密钥。

## Vercel 与 SPA 路由

`apps/admin/vercel.json` 保留原有 SPA 回写规则，使 React Router 深层链接可以刷新。部署平台的项目根目录需指向 `apps/admin`，并允许访问工作区根文件；安装使用根锁文件，构建命令使用 `pnpm --filter @nove/admin run build`，输出为应用目录的 `dist/`。

迁移不会自动修改原有 Vercel 项目或域名绑定；上线前应将部署仓库切换至 Monorepo，并核对 `VITE_API_BASE_URL`、构建目录和深层链接。

## 文档构建

```bash
pnpm --dir docs build
```

VitePress 静态产物位于 `docs/.vitepress/dist/`。`docs/` 保留独立的 `package.json`，依赖由 Monorepo 根锁文件统一管理。它与管理后台是两个独立入口，部署平台应使用工作区根安装，并分别指定构建命令和输出目录。
