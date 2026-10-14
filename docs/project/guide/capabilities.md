::: info 文档来源
本页迁移自 `nove-doc` 的 2026-09-17 版本，保留原有项目描述与方案。能力状态和版本号反映当时记录；当前实现请结合 [API 开发文档](../../developer/api/architecture/index.md)与 [Admin 开发文档](../../developer/admin/guides/getting-started.md)核对。参见[迁移记录](../../engineering/migrations/nove-doc.md)。
:::

# 能力状态总览

> 以**实际代码仓库现状**为准，标注 nove 各组件 / 接口协议 / AI 能力的状态（✅ 已可用 · 🟡 部分可用 · ⏳ 规划中）。本页是"文档宣称 vs 产品现实"的权威对齐入口，避免读者按过时文档接入尚未存在的能力。

## 一、组件状态

| 组件 | 技术栈 | 状态 | 说明 |
|---|---|---|---|
| **nove-api** | NestJS + TypeScript + Prisma 7 | ✅ 已可用 | 数据基础设施主服务：多源接入、组织多租户隔离、权限审计、REST/GraphQL/MCP、商业结算与分润冲销、云盘驱动、异步队列 |
| **nove-admin** | React + Vite + Ant Design | ✅ 已可用 | 人类管理入口：仪表盘、组织多租户、本地/平台用户与实名证件、项目与课程、云盘存储中心、会议与精简转写、商业订单/退款/产品/渠道、分润看板与规则/工资条、任务队列、跟踪报告、中心化集成管理（含连通性测试）等 16 大模块 |
| **nove-cli** | oclif + TypeScript | ✅ 已可用（v1.3.0） | 命令行数据工具：覆盖 `auth`（支持浏览器 OAuth 与凭证登录）、`meeting`、`minute`（结构化转写、平台用户发言提取、发言人总结）、`project`、`product`、`order`、`user`（含批量导入）、`tracking-report` 等 8 大业务域 |
| **nove-skills** | Agent Skill 包 | 🟡 部分可用 | 已提供 `meeting-api` 参考；`user-api` 等模块参考待补充 |
| **nove-ai** | FastAPI + Python | ⏳ 规划中 | **仓库为空，尚未实现**。当前复杂的预处理与跨源关联等重量级能力，前期过渡策略优先由外部 Agent 软件（如 OpenClaw、Hermes）代办；轻量调用由 nove-api 内嵌 LlmService 承担 |
| **PostgreSQL / Redis** | 基础设施 | ✅ 已可用 | PostgreSQL（Prisma 7 接入驱动适配器，44 个模块化子模型）；Redis（缓存 / 会话 / BullMQ 异步队列） |

## 二、接口协议状态

| 协议 | 状态 | 说明 |
|---|---|---|
| **REST API** | ✅ 已可用 | Swagger UI（`/api`）、OpenAPI JSON、Redoc，支持统一 `@Auth()` 装饰器与领域异常体系 |
| **GraphQL** | ✅ 已可用 | `/graphql`（Apollo，生产环境关闭 playground / introspection） |
| **MCP Server** | 🟡 部分可用 | 已支持 SSE 与 Streamable HTTP 两种传输；当前提供 7 个工具：`greeting-tool`、`get-meeting-stats`、`get-meeting-details`、`get-user-info`、`find-userid-by-username`、`find-userid-by-phone`、`find-userid-by-email` |
| **Skill** | 🟡 部分可用 | nove-skills 已发布 meeting-api 技能，覆盖会议 CRUD / 统计 / 转写 |
| **CLI** | ✅ 已可用（v1.3.0） | 完备覆盖 8 大业务域、30+ 个子命令，支持浏览器 OAuth 授权登录与输出格式定制 |
| **Webhook 接收** | ✅ 已可用 | 腾讯会议 / 飞书会议 / 微信小店 / Stripe 支付与退款回调，均验签 + 队列异步处理 + 幂等防重 |

## 三、AI 能力状态

| 能力 | 现状归属 | 状态 | 说明 |
|---|---|---|---|
| 轻量 AI 调用（总结 / 结构化输出） | nove-api 内嵌 `LlmService`（OpenAI 兼容接口，超时 / 重试 / 降级封装） | ✅ 已可用（基础版） | 会议摘要、结构化转写处理、周期跟踪报告汇总等已跑通 |
| AiClient 统一封装 | nove-api | ✅ 已可用 | 超时 / 重试 / 熔断 / 降级 |
| 异步 Job 模型 | nove-api（BullMQ + Bull Board） | ✅ 已可用 | queued → running → succeeded / failed，任务页可视化监控与重试 |
| Embedding 入库与向量检索 | nove-ai（规划） | ⏳ 规划中 | 向量库（pgvector / Milvus）未接入 |
| 跨源关联发现 / 知识图谱 / 语义层 | nove-ai（规划） | ⏳ 规划中 | 核心差异化能力，前期拟借力 OpenClaw / Hermes 等外部 Agent 代办 |
| 用户画像构建 | nove-ai（规划） | ⏳ 规划中 | 尚未实现 |
| 服务间 HMAC 鉴权 | nove-api ↔ nove-ai | ⏳ 规划中 | 面向规划中的自研 nove-ai 服务间安全调用 |

## 四、权限、安全与治理状态

| 能力 | 状态 | 说明 |
|---|---|---|
| 人机统一认证（JWT / OAuth / API Key `sk_`） | ✅ 已可用 | UnifiedAuthGuard，支持 CLI 浏览器 OAuth 授权登录与细粒度 Scope 绑定 |
| 组织级数据隔离（Org-Scoped Access） | ✅ 已可用 | 核心业务实体（会议、纪要、项目、服务配置等）强校验 `organizationId`，严格上下文隔离 |
| AI scope 白名单 | ✅ 已可用 | ScopeGuard + ApiKey scope 绑定（支持商品、订单、项目等细粒度控制） |
| RBAC + 细粒度权限点 | ✅ 已可用 | 角色 / 权限 / 数据权限规则（PermissionGuard），具备超级管理员保护机制 |
| 用户实名证件管理（Identity Documents） | ✅ 已可用 | 支持身份证/护照等证件上传、加密存储与后台审核流 |
| 会话安全与批量 JWT 吊销 | ✅ 已可用 | 支持用户级批量失效 JWT 令牌，防止凭据泄露风险 |
| 中心化集成与连通性自测（Tester） | ✅ 已可用 | 统一管理 TMeet/Lark/WeCom/Stripe/WechatShop 等配置，内置 TesterService 在线连通性自检 |
| 全链路审计 / Webhook 日志 | ✅ 已可用 | webhook-log、登录日志、API Key 用量日志、安全审计日志 |
| 数据脱敏 | 🟡 部分可用 | 敏感字段识别与脱敏策略逐步落地中 |

## 五、数据格式与扩展状态

| 能力 | 状态 | 说明 |
|---|---|---|
| 内置数据仓库格式（统一约定） | 🟡 部分可用 | 各业务域强类型表（44 个模块化模型）+ JsonB 扩展字段，元数据与溯源规范逐步收敛 |
| 云盘与业务资产绑定机制 | ✅ 已可用 | 网盘资源与项目封面、商品媒体档案直接建立关联归档 |
| 数据形态注册表 / 插件化接入 | ⏳ 规划中 | 方案探讨见 [数据格式与扩展机制（方案探讨）](../architecture/data-format.md)；当前未实现 |

## 六、状态约定

- **✅ 已可用**：代码已实现并可实际使用，文档可放心引用。
- **🟡 部分可用**：已实现核心路径，但覆盖面或完善度有限，接入前需确认具体范围。
- **⏳ 规划中**：仅有设计文档 / 路线图，仓库尚无实现，**请勿按已实现能力接入**。

> 本页随代码仓库状态定期更新；若发现与代码不一致，请以代码为准并修正本页。

---

> 相关：[数据源接入矩阵](./data-sources.md) · [需求与范围](./requirements.md) · [技术方案总览](../architecture/overview.md)
