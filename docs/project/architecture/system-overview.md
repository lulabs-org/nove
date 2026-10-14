::: info 文档来源
本页迁移自 `nove-doc` 的 2026-09-17 版本，保留原有项目描述与方案。能力状态和版本号反映当时记录；当前实现请结合 [API 开发文档](/developer/api/architecture/)与 [Admin 开发文档](/developer/admin/guides/getting-started)核对。参见[迁移记录](/engineering/migrations/nove-doc)。
:::

# nove 系统架构图集

本文档以架构图形式展示 nove（组织级 Agent 数据基础设施 / 数据网关）的整体架构。

## 一、ASCII 架构总览

```
┌──────────────────────────── 客户端 / 消费方层 ────────────────────────────┐
│  AI / Agent 调用方          外部系统 / Agent Harness       人类 (nove-admin)│
│  (API / MCP / Skill / CLI)  (读取数据、执行任务)          (16大业务与管理模块)│
└───────────────┬───────────────────┬───────────────────┬──────────────────┘
                │                   │                   │
                └────────────── API Gateway / BFF ──────┘
                                (Nginx / Kong / 网关)
                                        │
                           ┌────────────┴─────────────┐
                           │  身份与权限 Auth          │
                           │  人机统一 · 组织上下文透传 │
                           │  JWT 吊销 / API Key / RBAC│
                           └────────────┬─────────────┘
                                        │
     ┌──────────────────────────────────┴──────────────────────────────────┐
     │                      数据基础设施主服务 nove-api                      │
     │   (NestJS + Prisma 7：多源接入 / 组织隔离 / 商业分润 / 资产驱动 / 接口) │
     │  ┌──────────────────────┬──────────────────────┬─────────────────┐  │
     │  │   集成中枢与健康自测  │   商业结算与冲销追回 │   云盘数字资产  │  │
     │  │ (TMeet/Lark/WeCom/   │ (Stripe/订单权益/    │ (文件/目录/     │  │
     │  │  Stripe/TesterService│  分润摊销/Cron冲销)  │  商品封面绑定)  │  │
     │  └──────────────────────┴──────────────────────┴─────────────────┘  │
     └───────┬──────────────────────────┬──────────────────────────┬───────┘
             │                          │                          │
        同步HTTP/gRPC              异步MQ/BullMQ               定时Cron调度
             │                          │                          │
┌────────────▼────────────┐   ┌─────────▼─────────┐      ┌─────────▼─────────┐
│ 智能计算层(前期用外部Agent│   │ 异步任务 Worker   │      │ 自动化对账追回引擎 │
│ 代办，远期为 nove-ai)   │   │ (转写总结/追踪报告)│      │ (退款冲销/月度分润)│
└────────────┬────────────┘   └─────────┬─────────┘      └─────────┬─────────┘
             │                          │                          │
┌────────────▼──────────────────────────▼──────────────────────────▼───────────────┐
│                              数据层 / 基础设施层                                 │
│  PostgreSQL (Prisma 7 驱动适配器，44 个模块化子模型，严格 organizationId 逻辑隔离)│
│  Redis (缓存 / 会话 / BullMQ 队列)        Drive 云盘存储 (文件 / 目录 / 业务资产) │
│  Vector DB (pgvector / Milvus，规划中)    Search (可选)                          │
└───────────────────────────────────────┬──────────────────────────────────────────┘
                                        │
┌───────────────────────────────────────▼──────────────────────────────────────────┐
│                             可观测 / 安全 / DevOps                                │
│  Logs / Traces / Metrics (全链路 TraceId)  WAF / RateLimit  Secret Manager       │
│  全量人机访问审计 / Webhook 回放          CI/CD 自动化部署   Sentry 监控告警      │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## 二、Mermaid 架构图（分层版）

```mermaid
flowchart TB
    %% ───────────── 客户端 / 消费方层 ─────────────
    subgraph Client["客户端 / 消费方层"]
        C1["AI / Agent 调用方<br/>(REST / GraphQL / MCP / Skill)"]
        C2["运维与自动化终端<br/>(nove-cli v1.3.0 · OAuth 登录)"]
        C3["人类管理工作台<br/>(nove-admin · 16 大业务与管理模块)"]
        C4["外部数据源生态<br/>(腾讯会议/飞书/企微/Stripe/微信小店)"]
    end

    %% ───────────── 接入与网关 ─────────────
    GW["API Gateway / BFF<br/>(Nginx / 网关路由)"]

    %% ───────────── 认证与权限 ─────────────
    AUTH["统一身份与权限 Auth<br/>(人机统一 · 组织多租户隔离 · JWT 批量吊销 · 细粒度 Scope)"]

    %% ───────────── 数据基础设施主服务 ─────────────
    subgraph CORE["数据基础设施主服务 nove-api (NestJS + Prisma 7)"]
        direction TB
        API["核心数据与路由控制器"]
        INT["中心化集成管理<br/>(Configs & TesterService)"]
        COMMERCE["商业结算与退款追回引擎<br/>(Stripe 同步 / 分润 / 工资条)"]
        DRIVE["云盘数字资产中枢<br/>(网盘存储 / 商品与项目资源绑定)"]
    end

    %% ───────────── AI 与任务 ─────────────
    AI["AI 智能计算层<br/>(前期外部 Agent 代办 / 远期 nove-ai)"]
    WORKER["异步 Worker / BullMQ<br/>(结构化转写 / 摘要 / 跟踪报告)"]
    CRON["自动化定时引擎<br/>(退款全局冲销追回 / 月度分润核算)"]

    %% ───────────── 数据层 ─────────────
    subgraph Data["数据与存储基础设施层"]
        DB["PostgreSQL (Prisma 7 驱动适配器)<br/>44 个模块化模型 · 严格 organizationId 逻辑隔离"]
        REDIS["Redis 7<br/>(缓存 / 会话 / BullMQ 队列)"]
        STORAGE["Drive 云盘存储<br/>(内部存储 / 对象存储驱动)"]
        VECTOR["Vector DB (规划中)<br/>(pgvector / Milvus 语义检索)"]
    end

    %% ───────────── 可观测 & DevOps ─────────────
    subgraph OPS["可观测 / 安全 / 审计"]
        OBS["Logs / Traces / 全链路审计<br/>(Webhook 回放 / API Key 用量)"]
        SEC["安全中心<br/>(用户实名证件加密 / 敏感操作二次验证)"]
    end

    %% ───────────── 连接关系 ─────────────
    C1 --> GW
    C2 --> GW
    C3 --> GW
    C4 -->|Webhook / API| GW

    GW --> AUTH
    AUTH --> API

    API --- INT
    API --- COMMERCE
    API --- DRIVE

    API -->|同步调用| AI
    API -->|投递任务| WORKER
    CRON --> COMMERCE

    API --> DB
    API --> REDIS
    DRIVE --> STORAGE
    AI -.-> VECTOR

    API -.-> OBS
    AUTH -.-> SEC
```

## 三、Mermaid 架构图（彩色分层版）

```mermaid
flowchart TB
  %% ========= 样式 =========
  classDef client fill:#eef6ff,stroke:#3b82f6,stroke-width:1px,color:#0f172a;
  classDef core fill:#ecfeff,stroke:#06b6d4,stroke-width:1px,color:#0f172a;
  classDef svc fill:#f0fdf4,stroke:#22c55e,stroke-width:1px,color:#0f172a;
  classDef data fill:#fff7ed,stroke:#fb923c,stroke-width:1px,color:#0f172a;
  classDef ops fill:#fdf2f8,stroke:#ec4899,stroke-width:1px,color:#0f172a;

  %% ========= 客户端 / 消费方 =========
  subgraph L1["客户端 / 消费方层"]
    U1["AI / Agent 调用方<br/>API / MCP / Skill"]:::client
    U2["终端自动化 nove-cli<br/>v1.3.0 覆盖 8 大业务域 · OAuth 登录"]:::client
    U3["人类工作台 nove-admin<br/>16 大业务/资产/分润/治理视图"]:::client
    U4["外部协同与交易生态<br/>TMeet / Lark / WeCom / Stripe"]:::client
  end

  %% ========= 接入与权限 =========
  subgraph L2["接入层 & 权限层"]
    GW["API Gateway / BFF<br/>路由 · 验签 · 限流"]:::core
    AUTH["统一认证与安全 Auth<br/>人机统一 · 组织多租户隔离 · JWT 吊销 · 实名证件"]:::core
  end

  %% ========= 数据仓库主服务 =========
  subgraph L3["数据平面（核心域）"]
    API["nove-api 数据基础设施主服务 (NestJS + Prisma 7)<br/>组织隔离 · 交易与分润追回 · 云盘资产 · 集成中枢"]:::core
  end

  %% ========= 智能与异步 =========
  subgraph L4["智能平面 & 异步任务层"]
    AI["AI 智能计算层<br/>前期由 OpenClaw/Hermes 外部代办<br/>远期自研演进为 nove-ai"]:::svc
    WORKER["异步 Worker (BullMQ)<br/>转写总结 · 跟踪报告 · 消息分发"]:::svc
    CRON["自动化定时引擎<br/>退款自动追回冲销 · 月度分润摊销"]:::svc
  end

  %% ========= 数据与基础设施 =========
  subgraph L5["数据层 / 基础设施层"]
    PG["PostgreSQL (Prisma 7 驱动适配器)<br/>44 个模块化子模型 · organizationId 严格隔离"]:::data
    REDIS["Redis<br/>缓存 / 会话 / 任务队列"]:::data
    DRIVE_STORE["Drive 云盘存储<br/>文件 / 目录 / 商品与项目资源绑定"]:::data
    VECTOR["Vector DB（规划中）<br/>pgvector / Milvus 语义检索"]:::data
  end

  %% ========= 可观测与安全 =========
  subgraph L6["可观测 / 安全 / DevOps"]
    OBS["全链路审计与日志<br/>TraceId 透传 · Webhook 回放 · 行为可溯"]:::ops
    DEVOPS["CI/CD · Sentry 监控<br/>连通性自测 (TesterService) · 灾备"]:::ops
  end

  %% ========= 流向 =========
  U1 --> GW
  U2 --> GW
  U3 --> GW
  U4 --> GW

  GW --> AUTH
  AUTH --> API

  API -->|同步调度| AI
  API -->|事件/任务| WORKER
  CRON --> API

  API --> PG
  API --> REDIS
  API --> DRIVE_STORE
  AI -.-> VECTOR

  API -.-> OBS
  API -.-> DEVOPS
```

---

> 架构要点：**数据平面（nove-api）承载获取 / 存储 / 组织隔离 / 商业分润 / 资产管理 / 接口；智能平面（外部 Agent / 远期 nove-ai）承载高级预处理与关联；人类通过 nove-admin 管理；AI 与运维通过 API / MCP / Skill / CLI 访问；全链路受组织多租户与人机权限体系统一约束。**
