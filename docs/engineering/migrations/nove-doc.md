# 项目文档迁移记录

## 来源与完整性

- 来源仓库：[`lulabs-org/nove-doc`](https://github.com/lulabs-org/nove-doc)
- 来源分支：`main`
- 固定提交：[`3a9ba3fc4bf92471263bb8037c8995480f7a6532`](https://github.com/lulabs-org/nove-doc/commit/3a9ba3fc4bf92471263bb8037c8995480f7a6532)
- 来源提交时间：2026-09-17（北京时间）
- 迁移日期：2026-10-14
- 迁入范围：全部 **24 份 Markdown 文档**（包含首页和 README）、原 MIT 许可证、正文中的 ASCII / Mermaid 图表与外部参考链接。
- 接入方式：使用现有 `@nove/docs` VitePress 站点、导航、搜索、主题和根锁文件；不创建第二个文档应用，不导入旧 Git 历史。

[清单文件](./nove-doc-manifest.json)记录源提交、逐页源文件与初始迁入文件的 SHA-256，便于复核本次导入；后续正常维护允许正文改变，不要求永远匹配初始哈希。旧首页的 Hero 和功能卡片已转换为正文，保留介绍和能力摘要；其他页面只增加来源提示、改写站内链接，并将尾随空格形式的 Markdown 硬换行规范为反斜杠形式。历史 README 单独保留，旧开发命令不作为当前操作说明。

许可证原文保留在[原 MIT 许可证](../../project/license.md)。迁入文档中的版本与能力说明保持来源时间语境，不将设计方案或旧版状态自动视为当前能力。日常开发以 API、Admin 当前源码和开发文档为准。

## 目录映射

| 旧目录 | 新目录 | 责任 |
| --- | --- | --- |
| `guide/` | `docs/project/guide/` | 项目定位、需求、组织与产品说明 |
| `architecture/` | `docs/project/architecture/` | 跨应用架构与技术方案 |
| `security/` | `docs/project/security/` | 项目级权限、安全和隐私方案 |
| `partners/` | `docs/project/partners/` | 合作方与落地场景 |
| `roadmap/` | `docs/roadmap/project/` | 实施与三年演进方案 |
| `index.md` | `docs/project/index.md` | 项目文档入口及原首页内容 |
| `README.md` | `docs/project/source-readme.md` | 旧仓库使用说明，作为来源记录 |

### 逐页清单

| 来源 | 迁入位置 |
| --- | --- |
| [`README.md`](https://github.com/lulabs-org/nove-doc/blob/3a9ba3fc4bf92471263bb8037c8995480f7a6532/README.md) | [docs/project/source-readme.md](../../project/source-readme.md) |
| [`architecture/data-format.md`](https://github.com/lulabs-org/nove-doc/blob/3a9ba3fc4bf92471263bb8037c8995480f7a6532/architecture/data-format.md) | [docs/project/architecture/data-format.md](../../project/architecture/data-format.md) |
| [`architecture/index.md`](https://github.com/lulabs-org/nove-doc/blob/3a9ba3fc4bf92471263bb8037c8995480f7a6532/architecture/index.md) | [docs/project/architecture/index.md](../../project/architecture/index.md) |
| [`architecture/overview.md`](https://github.com/lulabs-org/nove-doc/blob/3a9ba3fc4bf92471263bb8037c8995480f7a6532/architecture/overview.md) | [docs/project/architecture/overview.md](../../project/architecture/overview.md) |
| [`architecture/system-overview.md`](https://github.com/lulabs-org/nove-doc/blob/3a9ba3fc4bf92471263bb8037c8995480f7a6532/architecture/system-overview.md) | [docs/project/architecture/system-overview.md](../../project/architecture/system-overview.md) |
| [`architecture/whitepaper.md`](https://github.com/lulabs-org/nove-doc/blob/3a9ba3fc4bf92471263bb8037c8995480f7a6532/architecture/whitepaper.md) | [docs/project/architecture/whitepaper.md](../../project/architecture/whitepaper.md) |
| [`guide/capabilities.md`](https://github.com/lulabs-org/nove-doc/blob/3a9ba3fc4bf92471263bb8037c8995480f7a6532/guide/capabilities.md) | [docs/project/guide/capabilities.md](../../project/guide/capabilities.md) |
| [`guide/data-sources.md`](https://github.com/lulabs-org/nove-doc/blob/3a9ba3fc4bf92471263bb8037c8995480f7a6532/guide/data-sources.md) | [docs/project/guide/data-sources.md](../../project/guide/data-sources.md) |
| [`guide/goals.md`](https://github.com/lulabs-org/nove-doc/blob/3a9ba3fc4bf92471263bb8037c8995480f7a6532/guide/goals.md) | [docs/project/guide/goals.md](../../project/guide/goals.md) |
| [`guide/index.md`](https://github.com/lulabs-org/nove-doc/blob/3a9ba3fc4bf92471263bb8037c8995480f7a6532/guide/index.md) | [docs/project/guide/index.md](../../project/guide/index.md) |
| [`guide/naming.md`](https://github.com/lulabs-org/nove-doc/blob/3a9ba3fc4bf92471263bb8037c8995480f7a6532/guide/naming.md) | [docs/project/guide/naming.md](../../project/guide/naming.md) |
| [`guide/organization.md`](https://github.com/lulabs-org/nove-doc/blob/3a9ba3fc4bf92471263bb8037c8995480f7a6532/guide/organization.md) | [docs/project/guide/organization.md](../../project/guide/organization.md) |
| [`guide/overview.md`](https://github.com/lulabs-org/nove-doc/blob/3a9ba3fc4bf92471263bb8037c8995480f7a6532/guide/overview.md) | [docs/project/guide/overview.md](../../project/guide/overview.md) |
| [`guide/product-philosophy.md`](https://github.com/lulabs-org/nove-doc/blob/3a9ba3fc4bf92471263bb8037c8995480f7a6532/guide/product-philosophy.md) | [docs/project/guide/product-philosophy.md](../../project/guide/product-philosophy.md) |
| [`guide/requirements.md`](https://github.com/lulabs-org/nove-doc/blob/3a9ba3fc4bf92471263bb8037c8995480f7a6532/guide/requirements.md) | [docs/project/guide/requirements.md](../../project/guide/requirements.md) |
| [`index.md`](https://github.com/lulabs-org/nove-doc/blob/3a9ba3fc4bf92471263bb8037c8995480f7a6532/index.md) | [docs/project/index.md](../../project/index.md) |
| [`partners/index.md`](https://github.com/lulabs-org/nove-doc/blob/3a9ba3fc4bf92471263bb8037c8995480f7a6532/partners/index.md) | [docs/project/partners/index.md](../../project/partners/index.md) |
| [`partners/lulabs.md`](https://github.com/lulabs-org/nove-doc/blob/3a9ba3fc4bf92471263bb8037c8995480f7a6532/partners/lulabs.md) | [docs/project/partners/lulabs.md](../../project/partners/lulabs.md) |
| [`roadmap/evolution.md`](https://github.com/lulabs-org/nove-doc/blob/3a9ba3fc4bf92471263bb8037c8995480f7a6532/roadmap/evolution.md) | [docs/roadmap/project/evolution.md](../../roadmap/project/evolution.md) |
| [`roadmap/implementation.md`](https://github.com/lulabs-org/nove-doc/blob/3a9ba3fc4bf92471263bb8037c8995480f7a6532/roadmap/implementation.md) | [docs/roadmap/project/implementation.md](../../roadmap/project/implementation.md) |
| [`roadmap/index.md`](https://github.com/lulabs-org/nove-doc/blob/3a9ba3fc4bf92471263bb8037c8995480f7a6532/roadmap/index.md) | [docs/roadmap/project/index.md](../../roadmap/project/index.md) |
| [`security/index.md`](https://github.com/lulabs-org/nove-doc/blob/3a9ba3fc4bf92471263bb8037c8995480f7a6532/security/index.md) | [docs/project/security/index.md](../../project/security/index.md) |
| [`security/permission-system.md`](https://github.com/lulabs-org/nove-doc/blob/3a9ba3fc4bf92471263bb8037c8995480f7a6532/security/permission-system.md) | [docs/project/security/permission-system.md](../../project/security/permission-system.md) |
| [`security/privacy-whitepaper.md`](https://github.com/lulabs-org/nove-doc/blob/3a9ba3fc4bf92471263bb8037c8995480f7a6532/security/privacy-whitepaper.md) | [docs/project/security/privacy-whitepaper.md](../../project/security/privacy-whitepaper.md) |

## 工程配置收敛

旧仓库的 `.vitepress/config.mts` 中导航与侧边栏合并到统一站点，保留本地搜索和 Mermaid 支持；主题使用统一站点现有主题，不覆盖其 API/Admin 样式。旧 `.vitepress/theme/` 两个文件、`.gitignore`、`package.json`、`pnpm-lock.yaml`、`vercel.json` 不重复导入。依赖已全部存在于 `@nove/docs`，不增加嵌套锁文件或安装流程。

从工作区根目录运行 `pnpm docs:dev` / `pnpm docs:build`；构建目录为 `docs/.vitepress/dist/`。正文链接已改为指向迁入位置的相对 Markdown 链接，同时兼容 GitHub 文件浏览与 VitePress；站点导航使用 `/project/…` 和 `/roadmap/project/…`。旧站的部署配置不能直接照搬为 Monorepo 根配置；若继续使用原 Vercel 项目，需将 Git 仓库切换至 `nove-api`，从仓库根执行 `pnpm docs:build`，输出目录设置为 `docs/.vitepress/dist`。

## 归档交接

用户已明确授权归档旧仓库。迁移前检查没有未合并 PR；迁移提交通过内容完整性检查、构建、浏览器验证及远端 CI 后，更新旧仓库 README、首页迁移提示与简介，再将其归档只读。发布时旧仓库提示应同时链接迁移 PR 与固定提交中的文档，避免 PR 尚未合并时出现失效入口。

旧提交、Issues 和 PR 保留为历史记录；新文档与问题反馈统一提交至 `nove-api`。归档不代表修改 Vercel 项目关联、迁移自定义域名或关闭原站点；这些部署设置仍需独立处理。具体归档结果与迁移 PR 链接记录在交付说明中。
