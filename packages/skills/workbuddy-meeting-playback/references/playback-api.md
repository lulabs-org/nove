# Workbuddy 回放查询接口

基址与认证方式和 `nove-api` 技能相同：根路径，无全局 `/api` 前缀，`Authorization: Bearer <token>`。Workbuddy 的 API Key 需要包含 `mcp-tool:meeting-playback`。管理员直接查询时使用带 `meeting-playback:read` 或 `meeting-playback:grant` 的身份。

## MCP

`catch-up-meeting-playbacks`

| 参数 | 说明 |
| --- | --- |
| `wecomUserId` | 当前会话发送人的企业微信 userid |
| `question` | 同学原话。时间、老师和缺席由服务端解析 |
| `teachers` | 可选。已经规范好的老师名，逗号分隔。不填则使用 `question` |
| `absence` | 可选。同学明确说缺席时可为 true |
| `startDate` / `endDate` | 可选。ISO 8601，需同时提供 |

`get-meeting-playback` 读取单场：`meetingId` 与 `wecomUserId`。

## HTTP

`POST /meeting-playbacks/catch-up`

```json
{
  "wecomUserId": "liutong",
  "question": "过去两三天我都没来，张老师那边、叶老师那边都讲了什么？"
}
```

`GET /meeting-playbacks/sessions/{meetingId}?wecomUserId=liutong`

## 响应里要遵守的字段

- `authorized`: 当前企微身份是否有有效授权
- `matched`: 授权范围内是否有符合条件的回放
- `message`: 给同学看的说明
- `sessions[]`: `teacherName`、`title`、`startAt`、`summary`、`keySegments`、`playback.entryPath`、`playback.entryUrl`、`catchUp`
- `catchUpPlan`: 补看顺序
- `replyText`: 可直接发送的文本

`sessions` 为空时不要补充别的会议。`summary` 为 null 时不要自行总结标题。

开通授权的管理接口是 `POST /admin/meeting-playback-grants` 和 `POST /admin/meeting-playback-grants/batch`，需要 `meeting-playback:grant`。企业微信身份必须已经绑定到这名同学的本地用户。
