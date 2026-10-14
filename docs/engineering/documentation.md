# 文档维护指南

文档按读者和代码责任划分：用户使用、公共工程协作、API 开发、Admin 开发与未来规划。文档依赖统一放在 `docs/package.json`（`@nove/docs`），共享根锁文件，与应用依赖隔离。

## 目录职责

```text
docs/
├── index.md                 # 统一首页，直达各类文档
├── engineering/             # Monorepo 协作、契约、脚本与文档维护
│   └── migrations/          # 迁移来源、过程和交接记录
├── developer/
│   ├── api/
│   │   ├── architecture/    # 后端结构、数据流、安全与技术栈
│   │   ├── guides/          # 后端测试、发布、数据库和部署
│   │   ├── modules/         # 后端业务模块与接口契约
│   │   └── integrations/   # 后端第三方集成与消息通道
│   └── admin/
│       ├── architecture/   # 前端路由、权限、状态与数据访问
│       ├── guides/         # 前端开发、测试和部署
│       ├── modules/        # 前端业务功能与页面职责
│       └── reference/      # 路由、权限、脚本与环境变量表
├── user/                    # 用户操作、接口接入与常见问题
├── roadmap/                 # 目标、提案和未完成的演进设计
└── public/                  # 站点静态资源
```

## 放置规则

- 跨应用的契约生成、Git 协作、CI 交付和文档规范放入 `engineering/`，应用文档通过链接复用。
- API 的 NestJS、Prisma、服务端权限和第三方调用放入 `developer/api/`；Admin 的 React 页面、路由、前端权限与状态管理放入 `developer/admin/`。
- 两个应用统一使用 `guides/` 表示操作指南；`architecture/` 解释结构，`modules/` 解释业务职责，`reference/` 保存查阅表。
- 用户操作或 API 调用教程放入 `user/`。第三方集成的后端实现与配置契约放入 API 集成文档，通过链接向其他读者提供入口，避免复制字段定义。
- 迁移过程放入 `engineering/migrations/`，不要把历史步骤当成日常操作要求。
- 尚未完成的设计放入 `roadmap/`，明确标注状态。安全等同时涵盖现状和设计参考的文档，应保留实现状态说明。

事实来源是当前源码、DTO、Prisma schema、应用与根目录 `package.json`、CI 和部署配置。不要依据目录名称把提案描述成已实现能力。

## 页面与导航

不创建开发者、API 或 Admin 的额外总览首页。统一首页直接链接工程指南、API 架构、Admin 快速开始和用户指南；保留有实际分类作用的索引页。导航与物理目录对应，规划与提案单独显示。

新增、移动或删除页面后，同步 `.vitepress/config.mts`，修复站内链接、README、环境示例与脚本中的路径。内部 Markdown 链接优先使用相对路径；配置与首页按钮使用站点绝对路径。运行时 localhost 地址用代码格式。

## 验证

在 Monorepo 根目录执行：

```bash
pnpm docs:dev
pnpm docs:build
git diff --check
```

文档开发端口为 5174，静态产物位于 `docs/.vitepress/dist/`。构建必须在 `ignoreDeadLinks: false` 下通过；目录调整后核对所有页面有导航入口、没有失效目标。修改 CI 路径用例时运行 `pnpm test:workspace`；修改命令说明时对照实际脚本，涉及行为变化再运行对应验证。
