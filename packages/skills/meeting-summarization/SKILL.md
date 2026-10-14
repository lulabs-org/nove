---
name: meeting-summarization
description: 总结录制会议/例会：拉取转写与参会人，输出逐人进展与整体回顾。
---

# 会议/例会总结工作流

实验室日常高频任务：用户要求「昨天有哪些例会」「总结某场例会的整体内容」「每个同学的项目进展」。适用于通过会议记录 API（本环境为 Nove）管理的录制会议（腾讯会议/飞书）。

## 工作流

1. **按明确时区查询**：把「今天/昨天/上周」换算成 Asia/Shanghai（+08:00）的 ISO 区间，并在回复中说明采用时区。例：`--start-date 2026-08-20T00:00:00+08:00 --end-date 2026-08-20T23:59:59.999+08:00`（注意 v1.3 CLI 的 flag 是 kebab-case：`--start-date`/`--end-date`，不是旧的 `--startDate`/`--endDate`）
2. **列出会议并锁定目标**：按 ID 确认目标（多条同名时展示标题/ID/平台/时间让用户选，不按标题猜）；要求「全部」时直接用 `--all`（CLI 自动合并分页），或处理分页直到 totalPages 或空页
3. **收集上下文**：
   - `meeting get <id>`：录制状态、处理状态、内嵌的 minute 记录列表
   - `meeting participants <id>`：参会人权威快照（**不要**用转写里的人名当参会人名单）
4. **拉取转写**：`minute list --meeting-id <id>` 找 COMPLETED 记录；对每条 `minute transcript <minute-id> --format json --json`；**合并所有记录的 segments 并按 startTime 排序**（一场会可能有多条记录，各覆盖不同片段）
5. **通读完整转写**：用 read_file 分段读完（转写几万字符很常见），不要只凭第一页下结论
6. **输出总结**：
   - 逐人进展：发言人段落统计 + 每人正在做的项目/状态/约定待办
   - 整体内容：会议结构（主题课/答疑）、核心论点、待办清单
   - 区分转写原文事实与自己的推断；疑似 ASR 错词标注不确定；脱敏手机号/邮箱/密钥

## 陷阱（本环境实测）

- **transcript 404**：部分记录返回「转录记录不存在」——转写尚未生成（processingStatus PENDING），换一条 COMPLETED 记录或如实报告状态，不是 CLI 故障
- **一场会多条 minute 记录**：可能重复或分段，全部拉取后合并去重；注意第一条记录可能无转写（404）
- **覆盖缺口**：转写可能只覆盖会议一部分（如 2h40m 会议只有前 65 分钟转写）——必须说明覆盖窗口 vs 会议总时长，不能假装总结完整
- **stats 403**：`meeting stats` 端点可能对当前 API Key 无权限（服务端授权问题），不是 CLI bug——报告并继续
- **分页字段不一致**：meeting list 用 `data[]`+total/totalPages；user list 用 `items[]`+total/totalPages；转写 json 是 `data[]`（{speakerName,startTime,endTime,text}）

## Nove 命令细节

命令清单、响应结构、分页与错误契约见 `nove` 技能的 references（output-and-errors.md / minutes.md / meetings.md / workflows.md），以 `nove <command> --help` 实时帮助为准。
