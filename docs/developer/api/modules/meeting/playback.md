# 会议回放与 Workbuddy 补课

同学缺席后，可以在分配给自己的企业微信 **Workbuddy** 里用自然语言查回放。查询结果只来自这名同学被授权的会议，并带上回放入口、已有纪要和补看顺序。

## 授权

授权存在 `meeting_playback_grants`，同时绑定：

- 同学的本地用户 `studentUserId`
- 该同学的企业微信平台用户 `wecomPlatformUserId`（平台必须是 `WECOM`，且 `localUserId` 已经指向这名同学）
- 可见范围：`ORGANIZATION`（组织内有回放的会议）、`PROJECT`（`meetings.project_id` 指向的项目）、`HOSTS`（指定老师）

`HOSTS` 用老师的显示名匹配主持人，例如「张老师」可以匹配「张老师」或「张伟」。可选 `boundApiKeyId`：填写后，只有这把 API Key 能代表该同学查询。企业微信回调里的发送人不受这把 Key 的限制，因为身份来自会话本身。

开通权限：`meeting-playback:grant`。查询权限：`meeting-playback:read` 或 `mcp-tool:meeting-playback`。迁移会把这三项挂到 `SUPER_ADMIN`、`ADMIN`、`MANAGER`、`HEAD_TEACHER`。已有环境执行迁移后即可使用；新环境跑权限种子时也会写入。

### 给一名同学开通

先确认企业微信通讯录用户已经同步成 `PlatformUser`，并且 `localUserId` 指向该同学。然后：

```http
POST /admin/meeting-playback-grants
Authorization: Bearer <管理员令牌>

{
  "studentUserId": "<同学的本地用户 ID>",
  "wecomPlatformUserId": "<该同学的 WECOM 平台用户 ID>",
  "scopeType": "HOSTS",
  "note": "试点",
  "hosts": [{ "hostName": "张老师" }, { "hostName": "叶老师" }]
}
```

批量开通使用 `POST /admin/meeting-playback-grants/batch`，正文为 `{ "grants": [ ... ] }`，同一事务提交。收回授权：`DELETE /admin/meeting-playback-grants/:id`。

同一组织、同一企微身份、同一范围（项目范围再加 `projectId`）的有效授权会就地更新，不会重复插入。

## 查询

```http
POST /meeting-playbacks/catch-up
Authorization: Bearer <Workbuddy API Key 或管理员令牌>

{
  "wecomUserId": "liutong",
  "question": "过去两三天我都没来，张老师那边、叶老师那边都讲了什么？"
}
```

`wecomUserId` 必须是当前 Workbuddy 会话的发送人。账号如果已经绑定了自己的企业微信身份，又没有 `meeting-playback:grant` / `mcp-tool:meeting-playback`，就不能改查别人。

没有授权时 `authorized` 为 `false`，`sessions` 为空。有授权但没有对应场次时 `matched` 为 `false`，并说明该时间段没有这些老师的回放。纪要尚未生成时仍返回回放入口，并写明纪要尚未生成。摘要和关键片段只引用已保存的纪要、要点或发言人总结。

单场入口：`GET /meeting-playbacks/sessions/:meetingId?wecomUserId=liutong`。响应里的 `playback.entryPath` 就是这个地址。配置 `NOVE_PUBLIC_API_URL` 后会同时给出 `playback.entryUrl`。该地址需要同一套身份和授权，它不是公开播放页。

时间按 `Asia/Shanghai` 解释。「过去两三天」「这几天」以及只说自己没来、又没有写天数时，默认最近 3 个自然日（含今天）。

## Workbuddy

企业微信文本消息进入 `/webhooks/wecom/events` 后，用 `FromUserName` 作为同学身份，把正文交给同一套查询。回复通过应用消息发送。服务集成里的企业微信配置需要填写 **Workbuddy 应用 AgentId**；没有 AgentId 或没有企业微信凭据时，查询和回复文本仍然会生成，但不会发到企微。这是上线前要补的组织配置，不改变授权和查询结果。

MCP 工具：

- `catch-up-meeting-playbacks`
- `get-meeting-playback`

Workbuddy 使用的 API Key 需要 scope `mcp-tool:meeting-playback`，并且创建者角色里也有这项权限。对应技能是 `packages/skills/workbuddy-meeting-playback`。
