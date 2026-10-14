::: info 文档来源
本页迁移自 `nove-doc` 的 2026-09-17 版本，保留原有项目描述与方案。能力状态和版本号反映当时记录；当前实现请结合 [API 开发文档](/developer/api/architecture/)与 [Admin 开发文档](/developer/admin/guides/getting-started)核对。参见[迁移记录](/engineering/migrations/nove-doc)。
:::

# 可拓展的数据格式：方案探讨

> **文档性质：方案探讨（Design Discussion）。** 本文不改变当前代码方向，仅记录"内置数据仓库格式"的问题现状、三种设计取向与推荐路径，供架构决策与后续迭代参考。当前代码**未实现**本文所述的注册表 / 插件化机制。

---

## 一、现状盘点：文档承诺 vs 代码现实

**文档宣称**（[项目概述 · 核心特点](/project/guide/overview)）：

> 内置数据仓库格式，支持通过自定义方式（插件或其他形式）接入新的数据形式。

**代码实际**：

- 无统一"内置仓库格式"——37 个 Prisma 模型按业务域各自建表（meet / order / product / channel / user …），本质是"强类型业务表集合"。
- 实际扩展手段是 **JsonB 逃生舱**，且各域各自为政：`meet.metadata`、`order.metadata`、`user_platform.platformData`、`meet_summary` 的 7 个结构化 Json 字段、`task.payload / result`、`system_config.value` 等，字段命名与结构无统一约定。
- 溯源已有雏形但未推广：`RecordingSource` 枚举、`webhook_log` 表、task 的 `payload / result` 能回答"数据哪来的"，但不是全仓库统一规范。
- 插件化仅有规划：`nove_api/docs/developer/roadmap/meeting-plugin-system.md` 明确标注"尚未实现"。

> 结论：**"可拓展的数据格式"目前是概念承诺，不是落地能力**，对应能力状态总览中的"规划中"。

## 二、概念分层：先定义清楚再讨论

| 层 | 回答的问题 | 现状 |
|---|---|---|
| **数据模型层** | 实体、字段、关系怎么定义 | 每域建表 + JsonB，无统一约定 |
| **元数据层** | 数据从哪来、属于谁、多敏感、留多久 | 碎片化（部分实体有 source / metadata） |
| **接入契约层** | 新数据形态如何"自描述"并接入 | 无，仅有会议插件规划 |

"可拓展的数据格式"横跨三层，缺一不可。

## 三、三种设计取向与权衡

### 取向 A：强类型核心 + 逃生舱（当前做法）

核心实体显式建模，每个实体带 `metadata JsonB` 兜底。

| 优点 | 缺点 |
|---|---|
| 类型安全、查询性能好、Prisma/TS 全链路 | 新形态需 DDL 迁移 + 写代码（与"插件化接入 ≤ 2 小时"KPI 冲突） |
| 零额外机制成本 | JsonB 用多了退化为无 schema 的 JSON 堆，AI 无法稳定消费 |

### 取向 B：通用实体仓库（Entity + Schema Registry）

通用 `DataRecord` 表 + 数据形态模板注册表，新形态声明式接入、免 DDL。

| 优点 | 缺点 |
|---|---|
| 任意新形态即插即用，最接近"数据仓库格式"字面意思 | 查询、索引、类型安全、字段级权限 / 脱敏均变难 |
| 接入成本最低 | 与现有 37 个强类型模型是两套体系，过渡成本高 |

### 取向 C：注册表式混合（Registry-based，倾向方向）

保留强类型核心域；另设**数据形态注册表（Data Format Registry）**承接外部 / 长尾形态：插件声明 `format id + JSON Schema + 接入方式 + 权限映射`，数据落通用 `DataRecord`（payload JsonB + 溯源 + 权限属性），核心域仍走强类型表。

| 优点 | 缺点 |
|---|---|
| 核心域体验不受损，长尾形态免 DDL | 需先定义注册表契约，一次性设计成本 |
| 权限 / 审计 / 脱敏在元数据层统一生效，落在"权限为本"第一差异化上 | 通用记录与核心域的关联查询需额外设计 |

> 本文仅记录取向，不改变当前实现（取向 A 维持现状）。

## 四、仓库格式必须统一的四个横切要素

无论选哪种取向，以下四件事是"数据仓库"区别于"一堆表"的关键，也直接支撑权限与隐私白皮书的承诺：

1. **溯源（Provenance）**：每条记录回答"来自哪个平台、哪个外部 ID、哪个事件 / 任务"。把现有 `RecordingSource` / `webhook_log` 做法推广为全仓库规范。
2. **权限属性（Ownership / Sensitivity）**：数据归属组织 / 部门、敏感分级。现状 `permission.resource` 是字符串标识，粒度不足以支撑字段级脱敏与 ABAC。
3. **生命周期（Retention）**：保留周期、销毁策略。隐私白皮书承诺"保留与销毁政策"，但 schema 层尚无支撑字段。
4. **一致性契约（Idempotency / Version）**：外部事件幂等键、记录版本、软删除。各表有 `deletedAt`，但幂等策略不统一。

## 五、插件化接入的契约要点（对齐"≤ 2 小时"KPI）

真正让新数据源快速接入的，是一套**声明式接入协议**：

- **Manifest**：`format id`、字段 JSON Schema、接入方式（webhook / API / 文件）、事件类型清单；
- **归一化转换（Normalizer）**：外部结构 → 仓库标准形态（对应现有 AI"字段映射"职责）；
- **权限映射随格式声明**：scope 范围、敏感字段脱敏规则随格式走，而非接入后人工配置；
- **沙箱试运行**：先以样例数据跑通再上线（呼应组织文档"沙箱数据先通"原则）。

该协议与 `meeting-plugin-system.md` 的 `IMeetingProvider` 契约同源，可泛化为 `IDataProvider`。

## 六、落地路径（供后续迭代参考）

- **短期**：将现有 JsonB 字段规范化，沉淀《仓库元数据规范》（统一 `metadata` 结构、溯源字段、幂等键命名），零迁移成本。
- **中期**：定义 Data Format Registry 最小契约（JSON Schema + Manifest），先在会议域试点（复用会议插件规划）。
- **长期**：插件 SDK + 沙箱环境，对应三年路线图 Year 2 插件化。

## 七、结论

"可拓展的数据格式"要成为真实能力，关键是**先统一元数据层（溯源 / 权限属性 / 生命周期 / 一致性），再谈接入契约**；当前代码维持取向 A，注册表机制与插件化属于规划方向，不改变现有实现。

---

> 相关：[项目概述 · 核心特点](/project/guide/overview) · [能力状态总览](/project/guide/capabilities) · [技术方案总览](./overview) · [三年技术与 AI 演进路线图](/roadmap/project/evolution)
