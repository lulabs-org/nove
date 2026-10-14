# 路由与权限表

下表来自当前 feature 路由配置。未声明权限表示前端仅要求登录；后端仍会对实际 API 进行鉴权。

| 路径                      | 页面     | 路由读取权限           | 菜单 |
| ------------------------- | -------- | ---------------------- | ---- |
| `/login`                  | 登录     | 公共路由               | 否   |
| `/`                       | 企业概览 | 仅登录                 | 是   |
| `/user-management`        | 本地用户 | `user:read`            | 是   |
| `/platform-users`         | 平台用户 | `user:read`            | 是   |
| `/users/list`             | 成员部门 | `user:read`            | 是   |
| `/users/roles`            | 角色管理 | `role:read`            | 是   |
| `/products`               | 产品管理 | `product:read`         | 是   |
| `/channels`               | 渠道管理 | `channel:read`         | 是   |
| `/orders`                 | 订单列表 | `order:read`           | 是   |
| `/order-refunds`          | 订单售后 | `order-refund:read`    | 是   |
| `/meetings`               | 会议管理 | `meeting:read`         | 是   |
| `/meetings/:id`           | 会议详情 | `meeting:read`         | 否   |
| `/reports/list`           | 追踪报告 | `tracking-report:read` | 是   |
| `/tasks`                  | 任务管理 | 仅登录                 | 是   |
| `/api-keys`               | API Keys | `api-key:read`         | 是   |
| `/permissions`            | 权限资源 | `permission:read`      | 是   |
| `/settings/system-config` | 服务配置 | `system:config:read`   | 是   |
| `/settings/organization`  | 企业信息 | `organization:read`    | 是   |
| `/settings/profile`       | 个人资料 | 仅登录                 | 否   |
| `/settings/security`      | 安全设置 | `system:config:read`   | 否   |

`/meetings/list` 是兼容重定向，`/404` 与通配路由负责未匹配页面。

## 权限来源

路由应从 `PERMISSIONS` 常量引用权限，不直接填写字符串。写操作还会使用 `create`、`update`、`delete`、`run`、`settle` 等更细粒度权限，完整集合以 `src/shared/utils/permissions.ts` 为准。

::: tip 维护提示
路由文件是运行时事实，本表是便于审阅的快照。修改路由或读取权限时必须同步本表。
:::
