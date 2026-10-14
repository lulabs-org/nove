::: info 文档来源
本页迁移自 `nove-doc` 的 2026-09-17 版本，保留原有项目描述与方案。能力状态和版本号反映当时记录；当前实现请结合 [API 开发文档](/developer/api/architecture/)与 [Admin 开发文档](/developer/admin/guides/getting-started)核对。参见[迁移记录](/engineering/migrations/nove-doc)。
:::

# nove 技术白皮书
**组织级 Agent 数据基础设施（数据网关）**

> ⚠️ **落地策略说明**：本文描述的目标架构中，自研的 `nove-ai` 独立服务目前处于**中后期规划**阶段（仓库尚未实现）。**在独立投入自研前，我们将优先采用 OpenClaw、Hermes 等成熟 Agent 软件作为外部智能计算引擎，由其代办关联发现、图谱构建等复杂的预处理任务**。当前极少量轻量级 AI 调用则暂由 `nove-api` 内嵌的 `LlmService` 承担。组件与能力实际状态见 [能力状态总览](/project/guide/capabilities)。

---

## 摘要（Abstract）

nove 是一个面向 AI 时代的**组织级 Agent 数据基础设施（数据网关）**。本白皮书系统性阐述 nove 在 **系统架构、AI 服务设计、工程治理与安全机制** 方面的整体技术方案，重点说明为何采用 **NestJS + FastAPI 的双后端架构**，以及如何通过 **数据平面 / 智能平面分离 + 人机统一权限**，支撑"组织数据成为 AI 可安全调用的资产"这一核心目标。

---

## 1. 背景与设计目标

### 1.1 行业背景

传统组织数据普遍存在以下问题：
- 数据孤岛：会议、订单、聊天、邮件、合同分散在各系统
- 数据难以被 AI 使用：缺乏统一接口与权限模型
- AI 与业务系统耦合，难以演进

nove 旨在通过 **工程化数据仓库 + 工程化 AI 能力**，重构组织数据的使用方式。

### 1.2 设计目标

- 多源汇聚：实时 / 定时汇聚组织各业务系统数据
- AI 关联：数据入库后经 AI 预处理，形成有机结合的数据仓库
- Agent 优先：通过 API / MCP / Skill / CLI 服务 AI 与 Agent
- 权限为本：对 AI 实行严格、全面、可审计的权限访问控制

---

## 2. 整体技术架构

### 2.1 架构总览

nove 采用 **数据平面与智能平面分离 + 人类入口独立** 的平台架构：

- nove-admin：人类用户入口（React），数据查看与操作
- nove-api：数据仓库主服务（NestJS），数据获取 / 存储 / 权限 / 接口
- nove-ai：智能服务（FastAPI），预处理 / 关联 / 图谱

```
AI/Agent(API/MCP/Skill/CLI)  →  nove-api  →  nove-ai
人类(nove-admin)             →  nove-api
                                    ↓
                         PostgreSQL / Redis / 向量库
```

### 2.2 架构设计原则

1. **数据确定性优先**
2. **AI 非单点故障**
3. **模块边界清晰，可演进**
4. **权限为本：AI 访问受控、可审计**

---

## 3. AI 服务独立化设计（FastAPI）

### 3.1 为什么 AI 必须独立

AI 能力具备以下特征：
- 依赖 Python 生态（LLM 编排、Embedding、图谱）
- 计算密集、响应不稳定
- 迭代频率远高于业务代码

因此，nove 将 AI 计算层设计为 **独立服务（远期为自研的 nove-ai，早期则直接使用 OpenClaw / Hermes 等外部 Agent 系统代办）**。

### 3.2 轻 / 重分层

| 层级 | 示例 | 实现 |
|---|---|---|
| 轻量同步 | 实体抽取、字段映射、短文本分类、单场会议摘要 | nove-api 内嵌封装（AiClient） |
| 重量异步 | Embedding、语义关联、知识图谱、批量总结、用户画像 | 早期借用 OpenClaw/Hermes 编排，远期归属 nove-ai（Python），Job 化 |

### 3.3 nove-ai 的职责边界

智能计算层（外部 Agent 软件 或 远期 `nove-ai`）**只负责计算，不负责业务真相**：
- 数据预处理与关联发现
- 知识图谱 / 语义层构建
- 批量转写总结与画像
- 受控文本生成

---

## 4. nove-ai 接口体系（MVP）

### 4.1 接口分层

- 运维接口（Health / Meta）
- 核心智能接口（Preprocess / Link / Embed / Summarize / Profile）
- 异步任务接口（Job）

### 4.2 关键接口示例

- POST /v1/preprocess/summarize\
- POST /v1/link/discover\
- POST /v1/embed/build\
- POST /v1/report/generate\

设计原则：**结构化输出优先，文本为辅。**

---

## 5. nove-api：数据仓库主服务（NestJS）

### 5.1 职责定位

nove-api 是平台的"数据中枢"，负责：
- 多源数据获取（Webhook / API / 定时拉取）
- 数据存储与内置仓库格式
- 人机统一权限（人类 + AI 独立身份）
- 多协议接口（REST / GraphQL / MCP / Skill / CLI）
- AI 调度与结果落库

### 5.2 AI Client 统一封装

所有 AI 调用通过 **AiClient** 完成，内置：
- 超时控制
- 自动重试
- 熔断保护
- 降级兜底

> AI 是加速器，不是业务生命线。

---

## 6. 服务间安全机制：HMAC

### 6.1 设计动机

nove-api 与 nove-ai 均为内部服务，重点在于：
- 身份可信
- 防篡改
- 防重放

### 6.2 HMAC 机制说明

- 双方共享密钥
- 对请求内容进行签名（METHOD | PATH | TIMESTAMP | BODY）
- 通过 Timestamp 防止重放攻击

MVP 阶段采用 HMAC，后续可升级至 Service JWT。

---

## 7. 人机统一权限体系

### 7.1 双主体模型

- **人类用户**：通过 nove-admin 操作，RBAC / ABAC
- **AI / Agent**：独立身份（API Key / scope 白名单），仅可访问被授权数据

### 7.2 审计与追溯

- 人类与 AI 的每次访问均记录
- 全链路 TraceId 透传
- 支持行为回放与合规检查

---

## 8. 异步任务与可观测性

### 8.1 Job 模型

适用于：
- 批量预处理
- 关联发现 / 图谱重建
- 报告生成

状态机：queued → running → succeeded / failed

### 8.2 可观测性原则

- TraceId 全链路透传
- AI 成功率 / 延迟 / 熔断次数可监控
- 权限审计事件实时可查

---

## 9. 工程共识与治理原则

- 字段稳定性 > 模型智能度
- 可解释性优于黑盒
- AI 故障 ≠ 系统故障
- MVP 先可用，再智能
- 数据格式可扩展（插件化接入新数据形态）

---

## 10. 技术选型总结

- 数据仓库主服务：NestJS + TypeScript
- AI 服务：FastAPI + Python
- 数据层：PostgreSQL + Redis（+ 向量库）
- 接口层：REST / GraphQL / MCP / Skill / CLI
- 部署：Docker → Kubernetes

---

## 11. 结语

nove 的技术体系并非追求"最前沿"，而是追求：

> **长期可演进、可治理、可复制的智能数据基础设施**

这正是"让组织数据成为 AI 可安全调用的资产"得以规模化落地的技术根基。
