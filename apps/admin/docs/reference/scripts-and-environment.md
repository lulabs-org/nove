# 脚本与环境变量

以下应用命令在 `apps/admin` 目录执行；安装依赖请在 Monorepo 根目录使用统一锁文件。

## 应用脚本

| 命令            | 用途                                      |
| --------------- | ----------------------------------------- |
| `pnpm dev`      | 启动 Vite 开发服务器                      |
| `pnpm build`    | TypeScript project build 后生成生产包     |
| `pnpm preview`  | 预览生产包                                |
| `pnpm lint`     | 检查 Admin 的 ESLint 规则                 |
| `pnpm format`   | 使用 Prettier 写入格式化结果              |
| `pnpm test`     | 单次运行 Vitest；监听用 `pnpm test:watch` |
| `pnpm test:run` | 单次运行 Vitest                           |
| `pnpm test:e2e` | 运行 Playwright                           |

## API 生成

| 命令                 | 用途                            |
| -------------------- | ------------------------------- |
| `pnpm gen:api`       | 按 `orval.config.ts` 生成客户端 |
| `pnpm gen:api:watch` | 监听 OpenAPI 并持续生成         |
| `pnpm api:generate`  | `pnpm gen:api` 的等价入口       |

`pnpm generate:api`、`pnpm gen:api` 和 `pnpm api:generate` 都通过根 Turbo 链路编译 API、离线导出 `apps/api/openapi/openapi.json`，再生成客户端。输入固定为同仓契约，移除了 `ORVAL_API_TARGET` 远程覆盖和安装时快照生成。`gen:api:watch` 仅监听已导出的 JSON；后端修改后需重新导出。

## 文档脚本

以下命令在 `docs/` 目录执行；从 Monorepo 根目录调用时可使用 `pnpm --filter @nove/admin-docs run <命令>`。

| 命令           | 用途                          |
| -------------- | ----------------------------- |
| `pnpm dev`     | 启动 VitePress 文档开发服务器 |
| `pnpm build`   | 严格构建文档站                |
| `pnpm preview` | 预览文档静态产物              |

## 环境变量

| 变量                | 使用阶段       | 说明                              |
| ------------------- | -------------- | --------------------------------- |
| `VITE_API_BASE_URL` | 开发与应用构建 | Nove API 根地址；会进入浏览器产物 |

不要在 `VITE_` 变量中保存密钥。所有 `VITE_` 值都应被视为对浏览器用户可见。
