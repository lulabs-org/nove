# 项目文档

::: info 文档来源
本页迁移自 `nove-doc` 的 2026-09-17 版本，保留原有项目描述与方案。能力状态和版本号反映当时记录；当前实现请结合 [API 开发文档](../developer/api/architecture/index.md)与 [Admin 开发文档](../developer/admin/guides/getting-started.md)核对。参见[迁移记录](../engineering/migrations/nove-doc.md)。
:::

## 组织级 Agent 数据基础设施

汇聚多源协作与业务数据，经 AI 智能关联重塑资产价值。在严密的组织多租户隔离与全链路审计下，通过 API、MCP、Skill 与 CLI 无缝开放，让 Agent 安全、合规、高效地调用组织数据。

### 原首页能力摘要

- **组织多租户隔离与权限治理**：核心实体强绑定 organizationId 上下文。人类与 AI 双主体模型，AI 按独立身份与最小 Scope 授权，支持 JWT 批量吊销与全量行为审计。
- **多协议与全功能客户端**：开放 RESTful API、GraphQL、MCP Server、Skill 与 nove-cli（v1.3.0 覆盖 8 大业务域，支持 OAuth 登录），无缝嵌入各类 Agent 平台。
- **商业结算与分润冲销闭环**：支持 Stripe 国际化交易与微信小店、订单权益生命周期管理、多模式自动分润核算、Cron 驱动退款追回冲销引擎与工资条系统。
- **多源生态汇聚与资产绑定**：实时与定时连接腾讯会议、飞书、企业微信、Stripe、微信小店与 Drive 云盘存储，支持网盘资源与项目封面、商品媒体资产绑定。
- **智能转写总结与轻重 AI 分层**：会议纪要结构化转写、发言人观点总结与周期跟踪报告；轻量调用内嵌封装，重型关联分析前期借力成熟 Agent 代办。
- **现代化架构与连通自测**：基于 NestJS + Prisma 7（44 个模块化模型），集成模块内置 TesterService 连通性在线自测，高可靠低故障。

## 按板块浏览

> 文档按主题分布在以下板块，每项主题有唯一权威来源；首页即为全站导航。

### 🎓 项目总览

- [项目概述](guide/overview.md) — 定位、三大数据资产飞轮、对外交互方式、权限控制、首个落地场景 · 愿景理念 · 系统定位 · 核心特点 · AI 归属决策 · 历史沿革 · 术语
- [需求与范围](guide/requirements.md) — 核心用户 · 典型场景 · 范围边界
- [目标与成功指标](guide/goals.md) — 项目目标 · 建设原则 · KPI
- [组织与运营](guide/organization.md) — 组织分工 · 风险应对 · 预算资源
- [项目名称](guide/naming.md) — nove 命名理念（New / Organized / Versatile / Empowered）

### 📡 产品现状（文档与代码对齐）

- [数据源接入矩阵](guide/data-sources.md) — 已接入 / 规划中数据源 · 接入方式 · 承载模块（含 Stripe、企微、云盘等）
- [能力状态总览](guide/capabilities.md) — 组件 / 接口协议 / AI 能力状态（对齐 nove-cli v1.3.0、Prisma 7、分润冲销等现状）

### 🤝 合作方与落地场景

- [陆向谦实验室介绍](partners/lulabs.md) — 首个落地客户与合作方（教育场景）

### 🏗️ 架构与技术

- [技术方案总览](architecture/overview.md) — 整体架构 · 系统四层架构 · 核心模块详解 · AI 轻/重分层 · Job 模型 · 技术选型
- [系统架构图集](architecture/system-overview.md) — ASCII / Mermaid 彩色分层架构图
- [技术白皮书](architecture/whitepaper.md) — 数据基础设施 + 智能平面独立化的技术论证
- [数据格式与扩展机制（方案探讨）](architecture/data-format.md) — 内置数据仓库格式现状 · 三种设计取向 · 落地路径

### 🗺️ 路线图

- [实施路线图](../roadmap/project/implementation.md) — 迭代策略 · 三阶段规划 · 达成现状与交付物清单
- [三年技术与 AI 演进路线图](../roadmap/project/evolution.md) — 2026-2028 系统 / AI / 数据治理 / 工程成熟度演进

### 🔒 权限安全与合规

- [人机统一权限体系](security/permission-system.md) — 组织级多租户隔离 · 双主体模型 · RBAC/ABAC · AI Scope 白名单 · JWT 批量吊销 · 实名证件合规
- [数据与隐私保护白皮书](security/privacy-whitepaper.md) — 数据治理原则 · 生命周期 · AI 访问审计 · 合规对齐

---

## 相关仓库

| 仓库 | 说明 |
| --- | --- |
| `nove_api` | 数据基础设施主服务（NestJS + Prisma 7）：多源数据接入、组织多租户隔离、商业结算与冲销、云盘驱动、权限审计、多协议开放接口 |
| `nove-ai` | AI 智能计算层（规划中，前期由 OpenClaw、Hermes 等外部 Agent 软件代办）：数据预处理、关联发现、知识图谱、批量智能计算 |
| `nove-admin` | 人类管理中枢（React + Vite + Ant Design）：16 大业务、资产、分润与治理视图 |
| `nove-cli` | 命令行运维与数据工具（oclif + TypeScript，v1.3.0 覆盖 8 大模块，支持浏览器 OAuth 登录） |
| `nove-skills` | Agent 技能包（meeting-api / user-api 参考） |

> 本站点承载 **项目级业务文档**（定位、项目书、架构、路线图、合规）；各代码仓库的技术文档仍由各自仓库维护。
