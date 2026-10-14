::: info 文档来源
本页迁移自 `nove-doc` 的 2026-09-17 版本，保留原有项目描述与方案。能力状态和版本号反映当时记录；当前实现请结合 [API 开发文档](../../developer/api/architecture/index.md)与 [Admin 开发文档](../../developer/admin/guides/getting-started.md)核对。参见[迁移记录](../../engineering/migrations/nove-doc.md)。
:::

# 数据源接入矩阵

> 本文档以**实际代码现状**为准，列出 nove 已接入 / 规划中的数据源、接入方式与承载模块。与 [需求与范围](./requirements.md) 配合阅读；能力整体状态见 [能力状态总览](./capabilities.md)。

## 一、接入方式说明

| 方式 | 含义 | 典型场景 |
|---|---|---|
| **Webhook 订阅（推）** | 数据源主动回调 nove-api，签名验证后实时入库 | 腾讯会议 / 飞书会议事件、微信小店事件、Stripe 支付与退款回调 |
| **API 拉取（拉）** | nove-api 定时 / 按需调用数据源开放 API 同步 | 腾讯会议录制/转写同步、Stripe 历史订单与退款拉取、企微成员拉取 |
| **内部业务数据** | nove 自身业务与管理系统产生的数据，直接入库 | 项目/课程、云盘资产、订单、退款、分润规则与记录、工资条、产品、渠道、平台用户、实名证件 |
| **生成类数据** | 由 nove 内 AI / 任务引擎产出的派生数据 | 会议摘要、结构化转写与发言人总结、周期跟踪报告 |

## 二、接入矩阵（以 nove-api 代码为准）

| 数据源 | 接入方式 | 承载模块 | 主要实体 | 状态 |
|---|---|---|---|---|
| **腾讯会议** | API 拉取（同步处理器）+ Webhook | `tmeet` | Meeting、MeetingRecording、Transcript、MeetingSummary、MeetingParticipant | ✅ 已接入 |
| **飞书 / 乐享会议** | Webhook 订阅 + 消息队列 | `lark` | Meeting（Platform=FEISHU） | ✅ 已接入 |
| **企业微信 (WeCom)** | 开放 API 同步 + 集成测试 | `wecom` | WecomUser、WecomDepartment、PlatformUser | ✅ 已接入 |
| **Stripe 交易结算** | Webhook 事件 + 增量/全量同步 API | `stripe` / `order` / `order-refund` | Order、OrderRefund、StripeAccount、SettlementData | ✅ 已接入 |
| **微信小店** | Webhook 事件 + 订单/售后接口 | `wechat-shop` | Order、OrderRefund | ✅ 已接入 |
| **业务订单 / 退款** | 内部业务数据（含权益天数/冻结/调整/结算时间） | `order` / `order-refund` | Order、OrderRefund、OrderBenefitAdjustment | ✅ 已接入 |
| **商业分润与退款冲销** | 内部业务数据 + 自动化 Cron 对账追回引擎 | `profit-sharing` | ProfitShareRule、ProfitShareRecord、ProfitShareModule、Payslip | ✅ 已接入 |
| **项目与课程** | 内部业务数据（支持绑定云盘封面与组织多租户隔离） | `project` | Project、Curriculum、ProjectMember | ✅ 已接入 |
| **云盘存储与资产** | 内部存储驱动 / 外部对象存储 | `drive` / `storage` | DriveFile、DriveFolder、StorageObject | ✅ 已接入 |
| **产品** | 内部业务数据（支持关联云盘媒体与规格） | `product` | Product | ✅ 已接入 |
| **渠道** | 内部业务数据 | `channel` | Channel | ✅ 已接入 |
| **平台用户** | 跨平台多账号映射（腾讯会议 / Zoom / Teams / 钉钉 / 飞书 / 企微 / Webex / Voov 等） | `user-platform` | PlatformUser | ✅ 已接入 |
| **用户与实名证件** | 注册 / 导入 / 证件上传与审核 | `user` / `auth` / `verification` / `oauth` | User、UserProfile、UserIdentityDocument、UserSecurityAudit | ✅ 已接入 |
| **周期跟踪报告** | 生成类（AI 汇总任务，队列化） | `tracking-report` / `task` | UserTrackingReport、TrackingReportSourceReport | ✅ 已接入 |
| **会议转写 / 摘要** | 生成类（结构化转写、发言人总结） | `minute` / `llm` | Transcript、TranscriptSegment、MinuteSummary、SpeakerSummary | ✅ 已接入 |
| **邮件 / 短信** | 通知类服务（发送，非数据汇聚） | `mail` / `sms` | —（工具能力） | ✅ 已接入 |
| **聊天记录 / 群聊** | 待定 | — | — | ⏳ 规划中 |
| **客户对接 / 合同** | 待定 | — | — | ⏳ 规划中 |
| **用户画像 / 语义关联 / 知识图谱** | 生成类（重量 AI，归属 nove-ai） | `nove-ai`（仓库为空） | — | ⏳ 规划中 |

> 说明：`nove-ai`（FastAPI）尚未实现，当前 AI 能力由 nove-api 内嵌 LlmService 承担轻量调用（详见 [能力状态总览](./capabilities.md)）。

## 三、入库链路约定

1. **统一处理与组织隔离**：无论推 / 拉，均走统一入库流程（元数据提取、权限映射、冲突解决），且核心实体严格注入组织上下文（`organizationId`）。
2. **幂等控制**：Webhook 事件按外部事件 ID 去重（微信小店、Stripe、腾讯会议等），重复回调不产生脏数据。
3. **溯源与审计**：每条入库数据保留来源（平台、外部 ID、回调时间 / 拉取时间、TraceId）。
4. **失败重试与健康探测**：
   - 拉取与队列任务失败进入重试 / 失败状态，可在 nove-admin「任务」页查看与重跑；
   - 各集成数据源提供统一的连通性探测器（`TesterService`），在集成配置页可实时测试连通性状态。

---

> 相关：[需求与范围](./requirements.md) · [能力状态总览](./capabilities.md) · [技术方案总览](../architecture/overview.md)
