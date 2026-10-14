# 部署

> 当前应用位于 `apps/admin`。本文应用命令在该目录执行；依赖统一在 Monorepo 根目录运行 `pnpm install --frozen-lockfile`，使用 pnpm 9.15.9。文档包共享根锁文件。

## 生产构建

```bash
pnpm generate:api
pnpm build
```

应用产物位于 `dist/`。构建时必须提供正确的 `VITE_API_BASE_URL`；Vite 环境变量会写入前端产物，不应放置密钥。

## Vercel 与 SPA 路由

`apps/admin/vercel.json` 保留原有 SPA 回写规则，使 React Router 深层链接可以刷新。部署平台的项目根目录需指向 `apps/admin`，并允许访问工作区根文件；安装使用根锁文件，构建命令使用 `pnpm --dir ../.. build:admin`，通过根 Turbo 先生成契约，输出为应用目录的 `dist/`。

迁移不会自动修改原有 Vercel 项目或域名绑定；上线前应将部署仓库切换至 Monorepo，并核对 `VITE_API_BASE_URL`、构建目录和深层链接。

## 文档构建

```bash
pnpm --dir docs build
```

VitePress 静态产物位于 `docs/.vitepress/dist/`。`docs/` 保留独立的 `package.json`，依赖由 Monorepo 根锁文件统一管理。它与管理后台是两个独立入口，部署平台应使用工作区根安装，并分别指定构建命令和输出目录。

## 独立 Nginx 镜像

从 Monorepo 根目录执行：

```bash
docker build -f Dockerfile.admin --build-arg VITE_API_BASE_URL=https://api.example.com -t nove-admin .
docker run --rm -p 8080:8080 nove-admin
```

API 仅参与构建时的契约生成，最终镜像仅含静态前端与非 root Nginx。支持 SPA 深层链接回退；不存在的静态资源返回 404。API 地址在构建时固化，运行时修改环境变量不会改变产物。
