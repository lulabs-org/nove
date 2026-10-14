::: info 文档来源
本页迁移自 `nove-doc` 的 2026-09-17 版本，保留原有项目描述与方案。能力状态和版本号反映当时记录；当前实现请结合 [API 开发文档](../../developer/api/architecture/index.md)与 [Admin 开发文档](../../developer/admin/guides/getting-started.md)核对。参见[迁移记录](../../engineering/migrations/nove-doc.md)。
:::

<!--
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-07 00:50:32
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-07 05:40:50
 * @Description: nove 技术方案总览（NestJS + FastAPI）
-->

# nove 技术方案总览（NestJS + FastAPI）

> 本文档是 nove 的**架构与技术**总览，融合了项目书中"总体架构 / 关键功能 / 技术方案"的内容。系统级架构图见 [系统架构图集](./system-overview.md)，完整技术论证见 [技术白皮书](./whitepaper.md)。

## 一、整体架构

nove 采用 **数据平面与智能平面分离 + 人类入口独立 + 统一连接中枢** 的现代化基础设施架构：

- **nove-admin**：人类用户入口（Vite + React + TS + Ant Design），承载 16 大业务、资产、结算与治理模块
- **nove-api**：数据基础设施主服务（NestJS + Prisma 7），承载数据获取 / 存储 / 组织多租户 / 权限 / 商业结算 / 多协议开放接口
- **nove-ai**：AI 智能服务（规划中，FastAPI + Python；前期由 OpenClaw、Hermes 等外部 Agent 软件代办），承载重型数据预处理 / 跨源关联 / 知识图谱
- **PostgreSQL**：核心业务数据库（Prisma 7 驱动适配器，44 个模块化子模型，严格按 `organizationId` 逻辑隔离）
- **Redis**：缓存 / 会话 / BullMQ 异步任务队列
- **云盘 / 对象存储（Drive）**：文件资产管理、分类索引与业务实体（商品/项目）多维关联
- **中心化集成中枢（Integrations）**：统一承载腾讯会议、飞书、企业微信、Stripe、微信小店、LLM 配置与连通性自动自测

```
AI/Agent (API / MCP / Skill / CLI) ──► nove-api ──► 外部 Agent / nove-ai (规划)
人类 (nove-admin)                 ──► nove-api        │
                             (组织隔离/权限/审计)      ▼
                                      PostgreSQL (Prisma 7) / Redis / 云盘存储 / 向量库
```

---

## 二、系统四层架构

```
[数据源与生态连接层]
  - 会议协同：腾讯会议（tmeet）、飞书/乐享会议（lark）Webhook + API 同步
  - 组织协同：企业微信（wecom）组织架构与用户集成
  - 商业交易：Stripe 支付与结算（stripe）、微信小店订单与售后（wechat-shop）
  - 数字资产：云盘存储（drive）、对象存储（OSS / S3 / COS）
  - 业务数据：项目与课程、订单与退款、分润规则与记录、工资条、产品、渠道、平台用户、实名证件

        │ 实时 Webhook 回调 · 定时/增量拉取 · 集成自测 · ETL 清洗与脱敏
        ▼
[数据与索引层]
  - 关系库（PostgreSQL + Prisma 7：44 个模块化模型，严格组织所有权 organizationId 隔离）
  - 存储中心（Drive 云盘存储、文件元数据、业务实体资产归档）
  - 向量库（pgvector / Milvus 规划中：嵌入与语义检索）
  - 版本、溯源与元数据管理；内置标准化数据仓库模型

        │ AI 预处理 · 商业结算与追回 · 关联发现 · RAG 管道
        ▼
[能力与中台层]
  - 智能转写与总结：结构化转写、平台用户发言提取、发言人总结、周期跟踪报告
  - 商业结算与冲销引擎：固定/摊销分润规则核算、全自动退款追回引擎（Clawback Engine）、工资条核算
  - 资产与业务关联：云盘资产 ↔ 项目封面 / 商品媒体双向绑定
  - 中心化集成管理：TMeet/Lark/WeCom/Stripe 等统一注册表与 TesterService 连通性自测
  - 人机统一权限治理：双主体模型、组织多租户穿透、RBAC+细粒度权限点、AI Scope 白名单、JWT 批量吊销、全量审计

        │ 统一网关 / 多协议暴露
        ▼
[接口与应用层]
  - 开发者与 AI 接口：RESTful API（Swagger/OpenAPI）、GraphQL、MCP Server、Agent Skill
  - 命令行客户端：nove-cli v1.3.0（覆盖 8 大业务域，支持浏览器 OAuth 授权登录）
  - 人类管理工作台：nove-admin（16 大功能视图：仪表盘、组织、项目、云盘、分润看板、集成管理等）
```

---

## 三、核心模块详解

### 3.1 多源数据接入与集成中枢（Integrations）

1. **统一连接中枢**：系统配置注册表收敛至统一 `configs` 模块，按组织维度管理各大第三方生态（TMeet, Lark, WeCom, Stripe, WechatShop, LLM 等）。
2. **连接性自测（TesterService）**：各个集成模块内置独立的健康探测器，在后台或 CLI 可实时自检凭证有效性与 API 通讯状态。
3. **推拉结合策略**：Webhook 实时订阅（签名防篡改、事件幂等去重）与 API 增量/全量同步互补。
4. **标准化溯源**：入库数据均注入平台类型、外部平台 ID、同步时间戳与 TraceId。

### 3.2 商业闭环与分润追回引擎（Commerce & Profit Sharing）

1. **交易与权益生命周期**：订单支持按日计算权益周期，支持权益主动冻结与手工调整；退款直接联动权益核销。
2. **多模式分润核算**：支持按固定周期月结、按模块摊销类型（Amortization Type）自动核算收益，支持分润规则克隆与批量处理。
3. **退款冲销追回引擎（Refund Clawback Engine）**：通过 Cron 自动化调度，定时对比已结算订单的退款记录，执行全局退款冲销追回，保证财务账目严密一致。
4. **工资条体系（Payslips）**：结合分润记录与基础调整项，自动化核算并生成组织成员月度工资条。

### 3.3 数字资产中枢与业务绑定（Drive）

1. **统一云盘资产管理**：支持文件的多级目录归类、上传、下载、存储桶抽象与元数据维护。
2. **业务实体强绑定**：商品媒体文件、项目与课程封面图片可直接从云盘选择或上传归档，消除孤立文件。

### 3.4 人机统一权限与多租户治理

1. **双主体模型**：人类用户与 AI Agent 均为独立访问主体，AI 绝不借用人类账号。
2. **组织所有权隔离（Organization Scoping）**：全系统 API 与数据层强制校验当前组织上下文（`organizationId`），实现多租户逻辑严格隔离。
3. **细粒度权限管控**：RBAC 权限点映射到菜单与操作；AI 访问受严格的 OAuth Scope 与 API Key 读写白名单约束。
4. **实名与凭据安全**：用户实名证件（Identity Document）加密管理与审核；支持用户级批量失效 JWT 令牌。

### 3.5 多协议接口矩阵

1. **REST / GraphQL**：基于 OpenAPI 3.0 契约驱动的标准数据接口，全量装饰器 `@Auth()` 与领域异常接管。
2. **MCP（Model Context Protocol）**：标准化暴露上下文与工具，供 Claude、Cursor 等 AI 客户端直连调用。
3. **nove-cli 命令行客户端**：v1.3.0 覆盖 8 大业务域（auth, meeting, minute, project, product, order, user, tracking-report），支持浏览器 OAuth 交互登录。
4. **Skill 技能包**：面向 Agent Harness 提供开箱即用的业务技能集。

### 3.6 运营监控与审计

- **全量链路审计**：记录访问主体（人类/AI）、时间戳、IP、资源标识与执行操作，可追溯可回放。
- **任务队列可视化**：BullMQ 异步任务状态（queued → running → succeeded → failed）在管理后台实时呈现与手动重试。

---

## 四、为什么 AI 服务要独立（FastAPI）

- Python 是 AI / 数据 / LLM 生态事实标准
- AI 推理慢、依赖重，不应拖慢数据仓库主服务
- AI 迭代频繁，需独立部署、回滚
- 未来可单独扩容 / 上 GPU

**结论：AI = 独立服务（nove-ai），不是业务模块。**

---

## 五、nove-ai（FastAPI）职责

> ⚠️ **落地策略与现状说明**：独立服务 `nove-ai` 目前为**中长期规划**（仓库尚未实现），本节为最终的既定职责设计。**在独立投入开发 `nove-ai` 之前，我们将优先使用 OpenClaw、Hermes 等成熟的 Agent 软件或平台，通过让其代为执行来完成复杂的预处理与数据关联等核心能力**。当前极少量的轻量 AI 调用则暂由 `nove-api` 内嵌的 `LlmService` 承担。整体能力状态见 [能力状态总览](../guide/capabilities.md)。

### 核心能力

1. 数据预处理（自动总结、实体抽取、字段映射）
2. 数据关联发现（跨源关联、语义层、知识图谱）
3. Embedding 入库与向量索引
4. 批量转写总结 / 报告生成
5. 用户画像构建

**原则：**
- 只做"智能计算"，不存业务真相
- 返回结构化 JSON 为主，文本为辅
- 慢任务一律异步 Job 化
- AI 行为全量可审计（TraceId 透传）

---

## 六、AI 能力归属：轻/重分层（架构决策）

| 任务类型 | 示例 | 归属 |
|---|---|---|
| 轻量同步 | 实体抽取、字段映射、短文本分类、单场会议摘要 | nove-api 内嵌封装（AiClient） |
| 重量异步 | Embedding 入库、语义关联发现、知识图谱构建、批量转写总结、用户画像 | 早期由 OpenClaw / Hermes 等 Agent 软件实现；远期归属 nove-ai（Python），Job 化 |

### 为什么实体归属 nove-ai

1. **"找关联、形成有机结合的数据仓库"是语义层 / 知识图谱工程** —— Python 的 LangChain / LlamaIndex / networkx / 向量库生态是 TS 无法比的。
2. **严格权限控制要求 AI 行为全量可审计** —— 所有 AI 计算收敛到 nove-ai 一个出口，统一加 TraceId / 审计 / 配额。
3. **不拖慢数据平面** —— nove-api 的核心职责是"数据快、权限严、接口稳"，AI 推理抖动不能影响它。
4. **演进自由度** —— 换模型、调 prompt、加 RAG 均在 nove-ai 内独立发布回滚，nove-api 只依赖稳定接口。

### nove-api 侧 AI 调用封装

- 所有 AI 调用统一封装为 **AiClient**（超时 / 重试 / 熔断 / 降级）
- 禁止 Controller 直接调用 AI
- AI 不可成为单点故障

---

## 七、服务间鉴权方案：HMAC

### HMAC 是什么？

> HMAC（Hash-based Message Authentication Code）
> 使用 **共享密钥 + 哈希算法** 对请求内容签名，用于：
> - 身份校验（是不是自己服务）
> - 防篡改
> - 防重放（配合 timestamp）

### nove-api → nove-ai 使用方式

**Header 示例：**
```
X-Timestamp: 1700000000
X-Signature: <hmac_sha256>
```

**签名内容：**
```
METHOD | PATH | TIMESTAMP | BODY
```

> 后期服务多了 / 对外开放 → 可升级为 Service JWT

---

## 八、异步任务（Job）模型

适用于：
- 批量 AI 预处理
- 关联发现 / 图谱重建
- 报告生成

### 标准状态
- queued
- running
- succeeded
- failed

**nove-api 接单，nove-ai 计算，结果回写数据库**

---

## 九、技术选型

### 9.1 推荐技术架构

#### 数据仓库主服务 nove-api
- **框架**: NestJS + TypeScript（模块化单体，强类型）
- **数据存储**: PostgreSQL + Prisma 7（接入驱动适配器，44 个模块化模型定义；主数据 / 权限 / 商业结算 / 资产元数据）；Redis（缓存 / 会话 / BullMQ 队列）；云盘存储（内部驱动与对象存储）
- **异步任务**: BullMQ（Redis）+ 定时 Cron 调度（退款冲销追回、数据同步）
- **接口**: RESTful API（OpenAPI/Swagger）+ GraphQL + MCP Server + CLI（nove-cli v1.3.0）+ Skill（nove-skills）

#### AI 服务 nove-ai（实体归属）
> 💡 **前期过渡策略**：暂不直接自研此服务，而是作为外部系统使用 OpenClaw、Hermes 等 Agent 软件，利用其现成的编排能力完成预处理、总结与关联等重型任务。待业务逻辑完全验证跑通后，再按需沉淀至自研的 `nove-ai` 服务中。

- **框架**: FastAPI + Python（AI 生态：LLM 编排、Embedding、图谱、pandas/networkx）
- **能力**: 数据预处理、关联发现、知识图谱、批量总结、用户画像
- **任务形态**: 异步 Job（queued → running → succeeded / failed），结果回写数据库

#### 人类入口 nove-admin
- **框架**: React + Vite + TypeScript + Ant Design
- 覆盖 16 大功能域：仪表盘、组织成员、本地/平台用户与实名证件、商业订单/退款/产品/渠道、分润看板与规则/工资条、项目管理、云盘存储中心、会议与转写、任务队列、追踪报告、中心化集成管理（含连通性自测）、安全设置中心等

#### 命令行客户端 nove-cli
- **框架**: oclif + TypeScript（v1.3.0）
- 8 大业务命令域：`auth`（含浏览器 OAuth）、`meeting`、`minute`、`project`、`product`、`order`、`user`、`tracking-report`

### 9.2 技术选型对比

| 方案 | 适用 | 推荐度 |
|---|---|---|
| NestJS（业务）+ FastAPI（AI） | 数据仓库 + AI 预处理，双后端解耦 | ⭐⭐⭐⭐⭐ |
| 单后端承载全部 | 早期 MVP、AI 需求轻 | ⭐⭐⭐ |
| 微服务 | 大型项目、多团队协作 | ⭐⭐⭐ |

### 9.3 核心技术要求

- **多源接入**：统一连接器 + 插件化扩展
- **异步调度**：转写、总结、批量预处理等长时任务
- **权限控制**：人机统一 RBAC + ABAC，细粒度数据访问控制
- **多协议**：REST / GraphQL / MCP / Skill / CLI
- **可观测性**：性能监控、错误追踪、AI 行为审计

---

## 十、关键工程共识（非常重要）

- AI 是加速器，不是单点故障
- 结构化输出 > 文本生成
- 所有 AI 接口必须可观测
- 字段稳定性 > 模型聪明程度
- MVP 先可用，再智能
- 权限为本：AI 访问数据必须受控、可审计

---

## 十一、一句话总结

> nove =
> **NestJS 承载数据秩序（获取 / 存储 / 权限 / 接口）**
> **FastAPI 承载智能计算（预处理 / 关联 / 图谱）**
> **AI 独立演进，但永远服务于"让组织数据成为 AI 可安全调用的资产"**
