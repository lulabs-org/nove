# Features Directory

功能层目录，按业务域拆分。

## 子目录说明

- **auth/** - 认证相关功能（登录、注册、权限等）
- **dashboard/** - 仪表盘功能
- 其他业务域模块...

## 目录结构

每个 feature 目录应包含：

```
feature-name/
  components/     - 该功能的专用组件
  hooks/         - 该功能的专用 hooks
  services/      - API 调用
  types/         - 该功能的类型定义
  index.tsx      - 入口文件
```

## 原则

- 按业务域拆分，高内聚
- 可以使用 shared 中的代码
- 不依赖其他 features（避免循环依赖）
- 每个 feature 应该是独立的
