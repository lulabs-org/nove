---
name: nove-api
description: 与 nove_api 后端服务交互的技能，覆盖会议记录管理（CRUD、统计、转写重处理等）。当用户提到 nove_api、nove、会议记录、meeting API、后端接口调用、会议管理、会议统计、会议转写、例会总结、查会议、拉转写等需求时使用此技能。
---

# Nove API Integration Skill

This skill provides the overarching guidelines and specific module references for interacting with the `nove_api` backend service.

## 1. Global Conventions

- **Base URL:** `https://noveapi.proflu.cn`（注：本项目未设置 `/api` 等全局前缀，模块路径如 `/meetings` 直接挂载于根路径）。
- **Authentication:** Most endpoints require a Bearer token in the `Authorization` header (`@ApiBearerAuth()`)。使用本技能前，需先在凭证配置中填写你的 `nove_api` Bearer Token。
- **Token Format:** 支持两种格式：JWT 格式（如 `eyJhbGci...`）和 `sk_` 前缀格式（如 `sk_JVvsC83wsa.TsuQ...`）。JWT 格式过期时间较短（约 15 分钟），需频繁刷新。
- **User-Agent Header:** 使用 `sk_` 格式 token 时，必须携带 `User-Agent` 请求头（如 `Apifox/1.0.0`），否则部分接口（尤其是转写接口）会返回空内容。JWT 格式 token 对此无要求。推荐所有请求统一携带 `User-Agent` 以避免兼容性问题。
- **ID Format:** Globally uses the CUID format.
- **Pagination Format:** Typically returns paginated structures: `{ data: [...], total, page, limit, totalPages }`.

## 2. API References Directory

Before interacting with any specific module, you MUST read the corresponding API guide in the `references/` directory.

- **Meeting Module:** [meeting-api.md](./references/meeting-api.md)
*(后续如果在 `nove_api` 中有新的模块，比如 user, order 等，可以在此处添加对应的索引并补充参考文档)*

## 3. Best Practices

- **Strict Validation:** Ensure that request bodies match the documented parameters exactly.
- **Date Formatting:** Use standard ISO format strings when sending `startDate` or `endDate` query parameters.
- **Exception Handling:** Always anticipate and properly handle error responses formatted by the backend's exception filters.

## 4. 常见工作流与坑

### 4.1 查询会议并拉取转写（最常用流程）

1. 调用 `GET /meetings?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` 获取会议列表
2. 遍历结果，检查每场会议的 `recordings` 数组
3. 拉转写前先判断：`duration` 为 0 或 `processingStatus` 为 `PROCESSING`/`PENDING` 的录制，转写大概率为空，跳过或标注「处理中」
4. 对就绪的录制调用 `GET /meetings/recordings/:recordingId/transcript`
5. 转写文本在 `text` 字段（注意：不是 `transcriptText`）

### 4.2 常见坑

- **Token 过期：**JWT token 约 15 分钟过期，返回 401 时直接提示用户提供新 token，不要反复重试。
- **会议日期跨天：**`scheduledStartAt` 使用 UTC 时间，北京时间（UTC+8）的凌晨会议可能落在前一天的 UTC 日期。查询时适当扩大日期范围（前后各加 1 天）。
- **录制与会议关联：**部分会议的 `recordings` 数组可能为空或未返回，不代表没有录制，可通过会议 ID 在列表结果中交叉查找。
