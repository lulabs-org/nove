# Shared Directory

共享层目录，存放可复用、无业务语义的代码。

## 子目录说明

- **lib/** - 第三方库封装、工具库（如 axios 封装、本地存储等）
- **ui/** - 通用 UI 组件（按钮、表单、弹窗等）
- **hooks/** - 通用 React Hooks（useDebounce、useLocalStorage 等）
- **utils/** - 纯函数工具（日期格式化、数据验证等）
- **types/** - 通用类型定义

## 原则

- 可复用，无业务语义
- 不依赖业务逻辑
- 可以被任何 feature 使用
- 保持独立性和可测试性
