# 测试与质量

> 当前应用位于 `apps/admin`。本文应用命令在该目录执行；依赖统一在 Monorepo 根目录运行 `pnpm install --frozen-lockfile`，使用 pnpm 9.15.9。文档包共享根锁文件。

## 测试分层

项目使用 Vitest、Testing Library 和 Playwright。

- 纯函数：覆盖输入边界、格式转换和业务分支。
- 组件：验证用户能观察到的渲染与交互，不绑定内部实现。
- 路由/权限：验证访问、重定向和菜单配置。
- E2E：用于真实浏览器中的关键流程；当前 `e2e/` 仍是最小示例，新增测试前应先准备稳定的 API 或测试环境。

## 命令

```bash
pnpm test:watch        # 监听模式
pnpm test:run          # 单次运行
pnpm test:ui           # Vitest UI
pnpm test:coverage     # 覆盖率
pnpm test:e2e          # Playwright
pnpm test:e2e:install  # 安装浏览器
```

完整交付还应执行：

```bash
pnpm lint
pnpm build
pnpm --dir docs build
```

## 测试位置

单元和组件测试与源码相邻，文件名使用 `*.test.ts` 或 `*.test.tsx`。共享初始化位于 `src/test/setup.ts`，Vitest 配置位于 `vitest.config.ts`。
