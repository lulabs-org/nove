# 文档维护指南

Nove 文档采用“当前事实、操作指南、模块契约、集成实现、外部参考、未来规划”分层，避免把愿景或厂商资料误当成当前系统行为。

## 目录职责

```text
docs/
├── developer/
│   ├── admin/          # Admin 专属架构、开发指南、模块与参考
│   ├── architecture/   # 当前系统的整体结构和数据流
│   ├── guides/         # 开发、数据库、部署和文档操作指南
│   ├── modules/        # Nove 自有模块与 API 契约
│   ├── integrations/   # 第三方服务在 Nove 中的实现
│   └── roadmap/        # 尚未完成或仍在演进的方案
├── user/               # 面向 API 使用者的说明
├── public/             # 站点静态资源
└── index.md            # 文档站首页
```

## 放置规则

- Admin 专属开发与维护说明：放入 `admin/`；跨应用的契约生成和交付流程放入 `guides/collaboration/`，通过链接复用。
- 描述当前跨模块结构：放入 `architecture/`。
- 回答“如何开发、测试、部署”：放入 `guides/`。
- 解释 Nove 领域模块、路由或权限：放入 `modules/`。
- 解释 Nove 如何调用第三方：放入 `integrations/`。
- 尚未完全实现的设计：放入 `roadmap/`，页面开头标明状态。

不要在多个目录复制同一契约。运行时 DTO、控制器、Prisma schema 和根 `package.json` 是事实来源，文档负责解释和导航。

## 页面与导航

站点首页 `docs/index.md` 直接链接工程指南、API 开发、Admin 开发与用户指南，不设置 `developer/index.md` 总览页。各文档分类的 `index.md` 说明分类边界并链接主要页面；规划与提案单独列出，不作为已实现能力。新增、移动或删除页面后同步 `.vitepress/config.mts`，并检查首页、README 与其他页面的引用。

内部 Markdown 链接使用相对路径；运行时 localhost 地址用代码格式，避免被 VitePress 当作构建期死链。不要关闭 `ignoreDeadLinks`。

文档站依赖统一放在 `docs/package.json`（`@nove/docs`），共享根锁文件，不进入 API 或 Admin 应用依赖。文档开发端口为 5174，构建产物位于 `docs/.vitepress/dist/`。

## 验证

```bash
pnpm docs:dev
pnpm docs:build
git diff --check
```

`pnpm docs:build` 必须在 `ignoreDeadLinks: false` 下通过。若页面描述了构建入口、脚本或生成文件，再运行对应代码命令验证，不只检查文字。
