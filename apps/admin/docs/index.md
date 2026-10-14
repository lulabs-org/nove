---
layout: home

hero:
  name: Nove Admin
  text: 开发与维护文档
  tagline: 以当前源码为准，说明后台的架构边界、业务模块和交付流程。
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 架构概览
      link: /architecture/overview

features:
  - title: 源码驱动
    details: 文档描述当前仓库已经实现的行为，不把提案当成现状。
  - title: 按业务域导航
    details: 从组织、交易、会议、报告、任务和系统治理快速定位代码。
  - title: 可验证
    details: 开发、测试、构建、API 生成与部署均给出仓库可执行的入口。
---

## 文档范围

本文档面向 Nove Admin 的开发者和维护者，覆盖 Web 管理后台本身。后端领域规则、数据库和第三方集成的最终定义应查阅 `nove_api` 仓库；接口类型则以其 OpenAPI 产物和本仓库当前调用为准。

建议新成员按以下顺序阅读：

1. [快速开始](/guide/getting-started)
2. [架构概览](/architecture/overview)
3. [模块地图](/modules/)
4. [开发工作流](/guide/development-workflow)
