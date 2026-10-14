# 治理与设置

## API Key

`features/governance/api-keys/` 管理 API Key 的创建、编辑、轮换、撤销和删除。Key 明文只应在创建或轮换成功后短暂展示，页面不得把它写入日志、URL 或持久化存储。

`ScopeSelector` 使用后端权限目录形成可授权范围。编辑时应保留当前值的可见性，但这不意味着前端可以授予后端未允许的 scope。

## 权限资源

`features/governance/permissions/` 管理权限资源及数据权限规则。这里管理的是后端权限模型，不应与前端的 `PERMISSIONS` 常量混为一体：常量只是前端引用当前权限名的方式。

## 服务配置

`features/governance/service-config/` 按模块读取、保存和清除系统配置。配置请求位于 `/admin/system-config/:module`。敏感值是否回显、如何加密和谁可读取由后端决定；前端文档与错误信息不应暴露秘密。

## 企业与个人设置

- `features/settings/organization-info/`：企业资料。
- `features/account/profile/`：当前用户资料。
- `features/account/security/`：安全设置入口。

`/settings/system-config` 与 `/settings/security` 当前使用系统配置读取权限，而企业信息使用组织读取权限。调整菜单归属时不要顺便改变授权语义。
