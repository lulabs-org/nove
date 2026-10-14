---
name: speaker-summary-sweep
description: 定时扫描最近 N 小时 Nove 例会，为缺少参会者总结的参会人生成详细 Markdown 总结并保存回 Nove（speaker-summary create）。用于 cron 定时任务或手动补扫；用户提到「定时总结参会人」「自动生成参会者总结」「补扫例会总结」时使用。
---

# Nove 例会参会者总结自动生成

扫描指定时间窗口内的 Nove 例会，为【缺少参会者总结】的参会人生成详细 Markdown 总结并写回 Nove。**只创建缺失总结，不修改、不删除任何已有数据。**

## 前置

- 依赖技能：`nove`（命令与纪律，必须严格遵循）、`meeting-summarization`（总结工作流）。两者冲突时以 `nove` 技能为准。
- 命令与 flag 以当前安装的 `nove --help` 实际输出为准；缺少 flag/命令时报告版本不兼容，不猜测替代参数。
- 所有自动化调用一律 `--json`：成功时 stdout 是单个 JSON 值；错误走 stderr、退出码非零。不要解析表格或普通文案。

## 参数

- `WINDOW_HOURS`：扫描窗口小时数，默认 4。cron 每 3 小时一轮时用 4，保证窗口重叠不遗漏（刚结束的会议录制未生成时可落入下一轮）。
- 时区：Asia/Shanghai（+08:00），在报告中说明。

## 执行步骤

1. **计算时间窗口**：运行 `date` 获取当前时间，往前推 `WINDOW_HOURS` 小时得到半开区间 `[start, now]`，ISO 8601 格式如 `2026-08-26T16:00:00+08:00`。
2. **列出会议**：`nove meeting list --start-date <start> --end-date <now> --all --json`。结果为空则报告「该时段无会议」并结束。
3. **对每个会议依次**：
   - a. `nove meeting participants <meeting-id> --all --json` 获取参会人权威快照，记录每个参会人的 `id`、`name`、`platformUserId`、`user` 信息。**不得用转写中的人名代替参会人名单。**
   - b. `nove minute list --meeting-id <meeting-id> --all --json` 获取 minute 记录；`errorMessage` 非空的记录跳过并说明原因。
   - c. 对每条可用记录执行 `nove minute transcript <minute-id> --format json --json` 获取转写；若返回「转录记录不存在」/404 或 `processingStatus PENDING`，如实报告转写尚未生成并跳过该记录（**这是正常状态，不是 CLI 故障**）。
   - d. 同一会议多条记录时，合并全部可用转写的 `segments` 并按 `startTime` 排序；转写可能只覆盖会议一部分，需说明覆盖窗口 vs 会议总时长。
   - e. `nove minute speaker-summary list <minute-id> --all --json` 检查该记录已有总结，记录已覆盖的 `platformUserId`。
4. **生成总结**：对每个【没有总结】的参会人，基于完整转写（用 read_file 分段读完，不只看开头）总结该成员情况。正文一律为 Markdown，至少包含：发言摘要（引用具体发言要点）、项目/工作进展、状态与结论、约定待办、关注点或风险。区分转写原文事实与自己的推断；疑似 ASR 错词标注不确定；脱敏手机号、邮箱、密钥等敏感信息。
5. **保存**：`nove minute speaker-summary create <minute-id> --platform-user-id <platformUserId> --part-summary '<markdown正文>' --generated-by AI`。一个参会人对应一条总结；`keywords` 可选，有清晰主题词时补充。
6. **验证**：创建后重新运行 `nove minute speaker-summary list <minute-id> --all --json`，确认新增总结已写入（**不只看成功提示**）。
7. **汇总报告**：扫描时段、会议数、每场会议的参会人数/已有总结数/新创建总结数、跳过的记录及原因、验证结果。

## 硬性纪律

- 参会人名单以 `participants` 接口为准，不得用转写中的人名代替。
- 创建前若 `platformUserId` 缺失（某参会人无平台身份），如实报告无法创建并跳过。
- 只创建缺失的参会者总结；不修改、不删除任何已有数据。
- 写请求超时或断网后，先通过 `get/list` 判断是否已生效，再决定是否重试。
- 用户要求「全部」时用 `--all`，不要只信单页数量。

## 陷阱（2026-08 实测 18 轮）

- **认证失效**：API Key 会被服务端周期性轮换。首轮只读请求即 401 / `API_AUTHENTICATION_ERROR` 时，中止并报告，等用户用 `nove login --method api-key --api-key-stdin` 更新后下一轮自动恢复；期间不要创建任何数据。
- **会议刚结束的轮次**：常见「无参会人快照 + 无 minute 记录 + `recordingStatus: PENDING`」→ 按规则 0 写入是**正确行为**，该会议会落在下一轮窗口继续处理（所以窗口必须重叠）。
- **一场会多条 minute 记录**：可能重复或分段，全部拉取后合并去重；注意第一条记录可能无转写（404）。
- **转写覆盖缺口**：转写可能只覆盖会议一部分（如 2h40m 会议只有前 65 分钟转写）——必须说明覆盖窗口，不能假装总结完整。
- **老记录 `status=COMPLETED` 但 `processingStatus` 仍 `PENDING`** 很常见，不代表转写可用。
- **脱敏显示**：终端/工具输出会把形似手机号的字符串显示为星号（如 `+658****7688`），数据本身未损坏；给用户展示号码时自行脱敏。

## 部署为 cron 定时任务

- 调度：`every 180m`（每 3 小时；窗口 `WINDOW_HOURS=4` 保证重叠）
- 附加技能（按序加载）：`nove`、`meeting-summarization`
- `enabled_toolsets`：`terminal`, `file`
- `deliver`：`local`（输出存 `cron/output/<job_id>/`，不推送聊天；需要推送时改 `origin`）
- prompt 必须自包含：内嵌本技能全部步骤 + 明确授权声明（如「本任务已由用户明确授权创建参会者总结（speaker-summary create），不涉及删除或修改」）+ cron 运行模式说明（最终回复由系统自动交付，不要调用 send_message；无新内容可报告时输出 `[SILENT]` 抑制交付）。
