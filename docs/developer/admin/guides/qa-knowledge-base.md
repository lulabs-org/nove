# 组织共享问答知识库

`/qa` 管理当前组织共享的问答数据集。同组织成员根据权限查看和维护内容，创建者不享有独占访问权；不同组织的数据保持隔离。

## 使用方式

- 列表按名称搜索、按通用／项目／妙记／云盘文件类型筛选，并使用服务端分页。历史关联业务对象的数据集也会展示。
- 新建入口创建通用数据集。打开数据集后，可搜索问答、按质量标记筛选，并查看已有的引用片段。
- 在列表中可修改数据集名称、类型和关联对象。项目、妙记和云盘文件类型需要选择当前组织中的关联对象。改为通用时清除关联。
- 详情地址使用 `/qa?dataset=<id>`，刷新或分享链接后仍可打开同一数据集。链接不会授予额外权限。
- 有编辑权限时显示明确的编辑按钮。新增、编辑、移动、删除问答会在同一数据库事务内更新相关数据集的更新时间。
- “已认可／待改进”是组织共享的单一质量标记，后续标记会覆盖前值；不是个人投票，也不提供人数统计。
- 删除数据集为软删除，组织成员不能再访问其中的问答；暂无恢复入口。单条问答删除为永久删除，页面会明确提示。

## 权限与兼容性

| 操作                   | 权限                                                            |
| ---------------------- | --------------------------------------------------------------- |
| 列表、数据集元数据     | `qa:session:read`                                               |
| 创建／编辑／删除数据集 | `qa:session:create` / `qa:session:update` / `qa:session:delete` |
| 查看问答内容           | `qa:record:read`                                                |
| 新增／编辑／删除问答   | `qa:record:create` / `qa:record:update` / `qa:record:delete`    |
| 修改共享质量标记       | `qa:feedback:create`                                            |

页面入口要求 `qa:session:read`。只有此权限时可查看数据集信息，但不会请求问答内容。为只读成员配置 `qa:session:read` 和 `qa:record:read`；为维护成员再配置需要的写入权限。

继续使用 `QASession`、`QARecord`、`QACitation` 三张表和 `/api/v1/qa` 路径，现有数据无需迁移。`QASession.userId` 保留创建者含义，不再作为访问过滤条件。现有数据集立即遵循组织共享规则，包括关联项目、妙记、云盘的数据集。

新增 `GET /api/v1/qa/sessions/:id/metadata`，仅返回数据集信息，避免加载全部问答。旧的 `GET /api/v1/qa/sessions/:id` 继续返回问答及引用，因此现在同时要求 `qa:session:read` 和 `qa:record:read`。调用该接口的客户端应确认两项权限均已授予。

问答列表使用 `GET /api/v1/qa/sessions/:sessionId/records`，支持分页、搜索和筛选。原 `GET /api/v1/qa/records` 已移除，调用方需改用指定数据集的路径。

列表支持 `page`、`pageSize`、`keyword`、`targetType`、`targetId`；不再限定当前创建者。后台权限点名称中的 session 为兼容保留。

## 当前范围

这是组织共享的问答内容管理模块。它尚未接通向量索引、AI 检索回答或发布审核流程，页面不显示虚构的“已索引”状态。批量导入和引用编辑接口的高级管理入口可另行扩展。

账号退出、切换用户或组织时使用新的 React Query 缓存；问答查询 key 也包含当前组织和用户，避免复用上一身份的数据。

## 验证

- API 单元测试：`pnpm --filter @nove/api exec jest --selectProjects unit --runInBand --testPathPattern=src/qa`
- 前端：先运行 `pnpm generate:api`，再运行 `pnpm --filter @nove/admin exec vitest run src/features/qa/pages/QADataHubPage.test.tsx src/app/providers/AppProviders.test.tsx src/app/routes/index.test.tsx`
- 数据库端到端：`pnpm --filter @nove/api exec jest --selectProjects e2e --runInBand --testPathPattern=qa/qa.e2e-spec`。使用本地隔离测试库；用例装配实际 PermissionGuard，覆盖同组织协作、只读拒绝、跨组织拒绝及内容更新时间。
