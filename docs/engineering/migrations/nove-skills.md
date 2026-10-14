# Skills 工作区迁移记录

## 来源与范围

- 来源仓库：[lulabs-org/nove-skills](https://github.com/lulabs-org/nove-skills)
- 来源分支：`develop`（迁移时远端默认分支）
- 固定提交：[513103fbe559c488697b03a7896123b4d78fb5f2](https://github.com/lulabs-org/nove-skills/commit/513103fbe559c488697b03a7896123b4d78fb5f2)
- 迁移日期：2026-10-14
- 目标：`packages/skills`，私有工作区包 `@nove/skills`

迁入源提交的全部 5 个文件：`meeting-summarization/SKILL.md`、`speaker-summary-sweep/SKILL.md`、`nove-api/SKILL.md`、`nove-api/references/meeting-api.md` 和 `nove-api/references/user-api.md`。文件内容保持字节一致，包括来源中为空的 `user-api.md`。不导入旧 Git 历史；旧仓库保留原提交及历史讨论。[迁移清单](./nove-skills-manifest.json)记录来源、目标和 SHA-256，供初始迁移复核，后续修改不要求保持原哈希。

## 工作区接入

`pnpm-workspace.yaml` 已匹配 `packages/*`；依赖集中在根锁文件。新增包的 `check` 校验技能前置字段、名称和相对行内链接，`test` 覆盖校验器的成功及失败路径；`lint` 调用 `check`，由现有 Turbo CI 根据变更范围选择任务。包没有 `build` 任务，也没有 API/Admin 对它的依赖，不进入应用的构建依赖图或运行镜像。

从仓库根运行：

```bash
pnpm skills:check
pnpm skills:test
pnpm test:workspace
```

安装方式、技能依赖与使用边界见 [Skills README](https://github.com/lulabs-org/nove/tree/main/packages/skills#readme)。本次仅迁移技能资产，没有安装用户技能、执行线上工作流、配置凭证或启用定时任务。两个会议技能依赖的 `nove` CLI 技能不在旧仓库内，需由使用者另行配置。

## 内容与交接

旧技能中的域名、接口路径、认证经验和 CLI 版本仍保留来源语境，迁移校验不代表当前线上接口或自动化行为验证通过。后续可结合当前 OpenAPI 与 CLI 合约单独更新。

确认内容完整性、技能校验、工作区任务选择及远端 CI，通过合并使目标目录进入主仓库后，再更新旧仓库 README、About 和主页链接，最后将旧仓库设为归档只读。历史安装地址和定时任务引用不会因 GitHub 归档自动切换，已有使用者需要按 Skills README 更新安装来源。保留本地旧仓库副本，不删除历史文件。
