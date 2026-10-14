# 工程指南

本目录面向整个 Nove Monorepo，说明 API、Admin 与文档站如何协作。应用实现分别位于 `apps/api` 和 `apps/admin`；应用专属的测试、数据库、部署和模块说明归入各自开发文档。

## 开始协作

1. 阅读[工作区脚本](./scripts.md)，确认命令的执行目录与作用范围。
2. 阅读[同仓契约与交付流程](./monorepo-delivery.md)，了解 API 编译、OpenAPI 导出、Admin 客户端生成及 CI 任务选择。
3. 按 [Git 协作规范](./git.md)准备分支、提交与 PR。
4. 修改文档时遵循[文档维护指南](./documentation.md)。

## 按应用查阅

- API：[后端架构](../developer/api/architecture/index.md)、[业务模块](../developer/api/modules/index.md)、[测试](../developer/api/guides/testing.md)、[数据库](../developer/api/guides/database/prisma-setup.md)、[部署](../developer/api/guides/deployment/overview.md)。
- Admin：[快速开始](../developer/admin/guides/getting-started.md)、[架构](../developer/admin/architecture/overview.md)、[测试](../developer/admin/guides/testing.md)、[部署](../developer/admin/guides/deployment.md)。

## 迁移记录

[Admin 工作区迁移记录](./migrations/admin.md)保留导入来源、迁移过程与旧仓库交接信息。日常开发以当前[契约与交付流程](./monorepo-delivery.md)及仓库配置为准。

[项目文档迁移记录](./migrations/nove-doc.md)记录原 `nove-doc` 的固定来源、完整清单、目录映射和归档交接。

[Skills 工作区迁移记录](./migrations/nove-skills.md)记录 Agent 技能的来源清单、工作区校验、安装依赖与旧仓库归档交接。
