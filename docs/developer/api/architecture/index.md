# 架构

本目录描述当前仓库中已实现的跨模块结构，不包含部署教程、单个模块 API 细节或未来方案。

- [安全架构与设计参考](./security.md)：认证、授权和安全边界，区分已实现能力与设计参考。
- [系统架构](./overview.md)：运行时拓扑、接入方式与主要边界。
- [技术栈](./tech-stack.md)：当前依赖、容器和 CI 基线。
- [关键数据流](./data-flow.md)：认证、Webhook、队列、AI 总结和动态配置。
- [模块地图](./module-map.md)：领域模块职责与依赖规则。
- [项目结构](./project-structure.md)：源码、Prisma、测试和文档目录约定。

具体操作进入[开发指南](../../../engineering/index.md)，模块契约进入[核心模块](../modules/index.md)，尚未落地的设计进入[路线图](../../../roadmap/index.md)。

后端操作指南：[测试](../guides/testing.md)、[数据库与迁移](../guides/database/prisma-setup.md)、[部署](../guides/deployment/overview.md)、[API 版本与发布](../guides/version-control.md)。
