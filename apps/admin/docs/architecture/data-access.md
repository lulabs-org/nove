# 数据访问与状态

## HTTP 基础设施

`src/shared/lib/api/http.ts` 提供统一 Axios 实例：

- `baseURL` 来自 `VITE_API_BASE_URL`
- 15 秒超时并携带 Cookie
- 自动附加 access token 和 `x-request-id`
- 对 401 进行单飞刷新与原请求重试
- 对 403 和 5xx 给出统一反馈

feature 不应自行创建另一套 Axios 实例。必须绕过统一实例的认证端点应集中在 auth API 中，并说明原因。

## 两类 API 代码

### 生成代码

`src/shared/lib/api/orval/business/` 来自 Nove API 的 OpenAPI，包含 DTO、请求函数和 React Query hooks。该目录被 ESLint 排除，更新方式是重新运行 Orval，禁止手改。

### Feature 包装

各 feature 的 `api/` 文件负责：

- 选择生成客户端或直接调用统一 `http`
- 稳定 query key 与分页/筛选参数
- 将接口类型收敛为页面需要的类型
- mutation 后精确更新或失效缓存
- 隔离后端命名变化对组件的影响

项目目前处于两种调用方式并存的状态。新增代码应优先复用已有模块的风格；发生 OpenAPI 合约变化时，先生成客户端再调整包装层。

## 状态归属

- 服务端数据：TanStack Query。
- 认证用户与会话：Zustand store。
- 表单和短暂 UI 状态：组件 state 或 React Hook Form。
- URL 可表达的分页/筛选：优先保持为稳定查询参数，避免刷新后丢失上下文。

不要把接口响应复制到全局 store，除非它确实是跨页面、客户端拥有且无法由查询缓存表达的状态。
