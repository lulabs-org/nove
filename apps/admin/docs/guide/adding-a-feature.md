# 新增业务模块

## 先确定边界

新模块应对应清晰的业务能力，而不是单个页面。优先沿用现有结构：

```text
src/features/example/
├── api/
│   └── exampleApi.ts
├── components/
├── pages/
│   └── ExampleManagement.tsx
├── types.ts
├── routes.tsx
└── index.ts
```

目录可以按复杂度裁剪；不要为尚未出现的需求预建层级。

## 接入步骤

1. 在 feature 内封装请求、类型、页面和专用组件。
2. 在 `routes.tsx` 声明路径、标题、菜单可见性和读取权限。
3. 从 feature 的 `index.ts` 导出路由。
4. 在 `src/app/routes/index.tsx` 聚合路由；纯菜单分组使用 `menuGroup`。
5. 新权限先与后端权限种子/接口对齐，再加入 `PERMISSIONS`。
6. 对写操作在按钮或操作区域使用 `Perm`，但不能把前端隐藏当作后端授权。
7. 为转换、调度、选项生成和关键交互补充 Vitest 测试。

## 数据请求

API 包装层负责把生成客户端或 `http` 请求转成页面容易使用的接口。React Query 的 `queryKey` 应稳定包含筛选和分页参数；mutation 成功后只失效受影响的数据。

## 完成标准

- 有路由级读取权限和操作级权限控制。
- loading、空状态、错误反馈和危险操作确认完整。
- 列表筛选与分页参数不会因刷新或重新请求而意外丢失。
- `lint`、相关测试和生产构建通过。
- 若引入新的维护规则，同步更新本项目文档。
