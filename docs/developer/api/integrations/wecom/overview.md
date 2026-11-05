# 企业微信集成与 Hermes 通信机制

`WecomModule` (`src/wecom`) 提供了 Nove API 与企业微信（WeCom）生态的双向通信能力，支持事件接收、Hermes 机器人消息推送以及群聊协同。

## 核心架构与通信流程

```mermaid
sequenceDiagram
    participant W as 企业微信开放平台
    participant C as WecomEventController (/webhooks/wecom/events)
    participant S as WecomEventService
    participant P as Hermes Processor / Bot
    participant Q as Redis 消息队列

    Note over W,C: 1. URL 有效性验证 (GET)
    W->>C: GET msg_signature, timestamp, nonce, echostr
    C->>C: 验证签名并解密 echostr
    C-->>W: 返回解密后的明文 echostr

    Note over W,C: 2. 事件与消息回调 (POST)
    W->>C: POST 加密 XML/JSON 消息
    C->>C: 验证签名并使用 @wecom/crypto 解密
    C-->>W: 同步响应 "success"
    C->>Q: 异步入队解密后的事件
    Q->>S: 消费消息并分派给对应 Handler
    S->>P: 触发 Hermes 机器人应答或业务同步
```

## 配置机制

企业微信凭据统一收拢至 **Nove Admin 管理后台「服务集成 → 企业微信」** 统一动态加密配置：

- `corpId`：企业微信的企业 ID (CorpID)
- `webhookToken`：用于回调签名验证的 Token
- `encodingAesKey`：用于消息体加解密的 EncodingAESKey（43 位字符）

配置通过管理后台写入并由 `SYSTEM_ENCRYPTION_KEY` 加密，控制器通过 `IntegrationsService.getEffectiveConfig()` 动态读取。

## Webhook 端点

端点为 `/webhooks/wecom/events`：

1. **URL 验证 (GET)**：
   - 企微后台配置回调地址时由平台自动发起。
   - 携带 `msg_signature`、`timestamp`、`nonce`、`echostr` 参数。
2. **事件接收 (POST)**：
   - 接收用户与机器人私聊、群聊 @机器人、打卡及成员变更等各类企微事件。
   - 使用 `@wecom/crypto` 的 AES-CBC 模式解密消息体。

## Workbuddy

Workbuddy 是分配给同学的企业微信助手。同学发来文本后，网关使用消息里的 `FromUserName` 作为该同学的企微 userid，只查询绑定到这个身份的会议回放授权，并回复回放入口、已有纪要和补看顺序。问题正文里的人名不会被当成另一名同学。

主动回复需要在企业微信集成配置中填写 Workbuddy 应用 `agentId`。没有这项配置或缺少企业微信凭据时，授权和查询接口仍然可用，回复不会发到会话里。查询规则见 [会议回放与 Workbuddy 补课](../../modules/meeting/playback.md)。

## 应用消息

企业微信应用消息负责把 Workbuddy 的回复送到同学会话里：
- 支持通过应用消息接口向指定企微成员推送会议总结、待办提醒与审核通知。
- 同学在单聊中向 Workbuddy 提问时，回放补课走上面的授权查询；其他即时检索仍通过 LLM 与 MCP 工具完成。
