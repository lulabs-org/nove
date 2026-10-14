# 快速开始

> 当前应用位于 `apps/admin`。本文应用命令在该目录执行；依赖统一在 Monorepo 根目录运行 `pnpm install --frozen-lockfile`，使用 pnpm 9.15.9。文档包共享根锁文件。

## 环境要求

- Node.js 22.12+（CI 使用 22.23.1）
- pnpm 9.15.9
- 一个可访问的 Nove API 实例

## 安装与启动

在 Monorepo 根目录安装依赖，然后进入应用目录：

```bash
pnpm install --frozen-lockfile
cd apps/admin
```

创建 `.env.local`，指定 API 根地址：

```dotenv
VITE_API_BASE_URL=http://localhost:3000
```

启动应用：

```bash
pnpm dev
```

Vite 默认提供本地开发地址。登录、刷新令牌和后续业务请求都会使用 `VITE_API_BASE_URL`。

## 启动文档站

```bash
pnpm dev
```

以上命令在 `docs/` 目录执行。也可以从 Monorepo 根目录运行 `pnpm docs:admin:dev`。修改 Markdown 或 VitePress 配置后会热更新；提交前在 `docs/` 目录运行 `pnpm build`，严格检查内部链接并生成静态站点。

## 首次定位代码

- 应用入口：`src/main.tsx` 与 `src/app/App.tsx`
- Provider 与路由实例：`src/app/providers/AppProviders.tsx`
- 路由聚合：`src/app/routes/index.tsx`
- 布局和菜单：`src/app/layout/`
- 业务实现：`src/features/`
- HTTP 与生成客户端：`src/shared/lib/api/`

工作区安装会自动从冻结 OpenAPI 快照生成客户端。使用 `--ignore-scripts` 时，须手动运行 `pnpm generate:api:snapshot`；这一步不需要在线 API。
