# 会议、报告与任务

## 会议

`features/meetings/` 提供会议列表、详情和编辑入口。详情页会组合会议基础信息及后端返回的相关记录；旧路径 `/meetings/list` 仅用于重定向到 `/meetings`。

会议接口包装位于 `api/meetingApi.ts`，显示格式工具位于 `utils/formatters.ts`。列表和详情的响应形状可能不同，组件不应假设列表项包含完整详情。

## 追踪报告

`features/reports/` 展示追踪报告列表与详情，并支持按主体检索及生成报告。报告主体解析集中在 `lib/reportSubject.ts`，避免页面重复推断主体类型或显示名。

列表保持紧凑；需要完整主体信息时由详情交互再获取。报告生成是异步业务过程，前端的成功反馈只代表请求被接受或记录已创建，不应擅自解释为所有后台计算完成。

## 后台任务

`features/tasks/` 管理任务定义、运行、暂停、恢复和调度。Cron 编辑与可读描述由 `CronScheduleEditor` 及 `lib/taskScheduling.ts` 处理；任务 payload 的构造集中在 `lib/taskPayload.ts`。

新增任务类型时必须同时对齐后端任务注册名、payload 合约和前端表单。不要把自由输入 JSON 作为长期替代方案。
