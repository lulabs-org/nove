---
layout: home

hero:
  name: Nove Admin
  text: 开发与维护文档
  tagline: 以当前源码为准，说明后台的架构边界、业务模块和交付流程。
  actions:
    - theme: brand
      text: 快速开始
      link: /developer/admin/guide/getting-started
    - theme: alt
      text: 架构概览
      link: /developer/admin/architecture/overview

features:
  - title: 源码驱动
    details: 文档描述当前仓库已经实现的行为，不把提案当成现状。
  - title: 按业务域导航
    details: 从组织、交易、会议、报告、任务和系统治理快速定位代码。
  - title: 可验证
    details: 开发、测试、构建、API 生成与部署均给出仓库可执行的入口。
---

## 文档范围

本文档面向 Nove Admin 的开发者和维护者，覆盖 Web 管理后台本身。后端领域规则、数据库和第三方集成的最终定义以同仓 `apps/api` 实现为准，参见[后端模块](../modules/index.md)与[集成文档](../integrations/index.md)；接口类型以同仓 OpenAPI 产物和 Admin 当前调用为准。前后端协作流程见[契约与交付工作流](../guides/collaboration/monorepo-delivery.md)。

建议新成员按以下顺序阅读：

1. [快速开始](/developer/admin/guide/getting-started)
2. [架构概览](/developer/admin/architecture/overview)
3. [模块地图](/developer/admin/modules/)
4. [开发工作流](/developer/admin/guide/development-workflow)
