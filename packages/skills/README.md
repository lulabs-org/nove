# @nove/skills

Nove 的 Agent 技能工作区，原 `lulabs-org/nove-skills` 的内容统一在这里维护。这个私有包管理技能文件及校验工具，不发布到 npm，也不参与 API、Admin 的构建或运行镜像。

## 技能清单

| 技能                    | 入口                                         | 用途与依赖                                                                            |
| ----------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------- |
| `nove-api`              | [SKILL.md](./nove-api/SKILL.md)              | Nove API 接入和会议 API 参考；需要目标环境的认证与接口配置                            |
| `meeting-summarization` | [SKILL.md](./meeting-summarization/SKILL.md) | 会议转写整理与总结；需要 Nove CLI 和名为 `nove` 的 CLI 技能                           |
| `speaker-summary-sweep` | [SKILL.md](./speaker-summary-sweep/SKILL.md) | 补齐参会者总结；需要 Nove CLI、`nove` 技能、`meeting-summarization`，写入前需用户授权 |

Nove CLI 仍在 [lulabs-org/nove-cli](https://github.com/lulabs-org/nove-cli) 独立维护。此包不包含名为 `nove` 的 CLI 技能，也不自动安装 CLI、凭证或定时任务。使用两个会议技能前，应在自己的 Agent 环境中配置 CLI 技能并确认 `nove --help` 可用。

## 安装技能文件

从主仓库根目录，把需要的整个技能目录复制到 Agent 支持的技能目录，保留 `SKILL.md` 和 `references/` 的相对结构。以下为 Codex 用户级目录示例，目标已存在时会跳过复制，避免覆盖已有安装：

```bash
# 在仓库根目录运行；按需更换技能名称
skill_name=meeting-summarization
skills_dir="${CODEX_HOME:-$HOME/.codex}/skills"
if [ -e "$skills_dir/$skill_name" ]; then
  echo "目标技能已存在，请先比较并备份已有版本" >&2
else
  mkdir -p "$skills_dir"
  cp -R "packages/skills/$skill_name" "$skills_dir/$skill_name"
fi
```

安装 `speaker-summary-sweep` 时也需要安装 `meeting-summarization`。复制后让 Agent 重新加载技能；迁移旧安装时，对比后更新原目录，不要同时启用同名的新旧版本。该操作只复制文件，不会执行技能、访问线上数据或启动定时任务。后续升级需重新同步目录；工作区包不会自动更新已安装的副本。

## 维护与校验

在主仓库根目录统一安装依赖：

```bash
pnpm install --frozen-lockfile
pnpm skills:check
pnpm skills:test
```

也可以运行 `pnpm --filter @nove/skills check`。校验检查所有一级技能目录的 `SKILL.md`、YAML `name` / `description`、名称与目录的一致性、名称唯一性，以及技能正文和引用文档中的相对行内 Markdown 链接。它不验证线上接口、外部 URL、CLI 兼容性或技能执行结果。

通过 `lint` 和 `test` 接入现有 Turbo CI；仅修改这个包时执行技能校验及测试，不触发 API、Admin 构建。不要给这个包增加业务服务依赖或运行时凭证。

## 迁移来源与兼容边界

原仓库 `develop` 的提交 `513103fbe559c488697b03a7896123b4d78fb5f2` 中，3 份技能和 2 份参考文件原样保留。来源清单和 SHA-256 见[迁移清单](../../docs/engineering/migrations/nove-skills-manifest.json)，流程见[迁移记录](../../docs/engineering/migrations/nove-skills.md)。这些哈希用于核对初始迁移；后续正常维护可以修改技能。

原说明中的域名、API 路径、认证行为和 CLI 版本属于来源时期的说明；本次迁移没有验证线上兼容性。调用前使用目标环境当前的接口契约及 CLI 帮助核对，不应将历史经验视为当前服务保证。`nove-api/references/user-api.md` 在来源提交中为空，此次保留该文件，不将其描述为完整的用户 API 文档。
