# Cursor规则说明

本项目包含5个Cursor规则文件，用于帮助理解和维护VS Code Git分支别名插件：

## 规则文件列表

1. **project-structure.mdc** (alwaysApply: true)
   - 项目整体架构和文件结构说明
   - 核心模块和功能概述
   - 始终应用于所有请求

2. **typescript-conventions.mdc** (globs: *.ts,*.tsx)
   - TypeScript编码规范和最佳实践
   - VS Code扩展开发特定规范
   - 只应用于TypeScript文件

3. **jira-integration.mdc** (description: Jira集成和API使用规范)
   - Jira API集成规范
   - 分支名到Jira键的提取规则
   - 性能优化和错误处理

4. **git-integration.mdc** (description: Git仓库管理和分支处理规范)
   - Git仓库管理和监听模式
   - 多仓库支持和分支处理
   - 资源管理和刷新机制

5. **status-bar-feature.mdc** (description: 状态栏点击打开Jira链接功能的实现规范)
   - 状态栏点击功能的核心逻辑
   - 智能分支分叉检测
   - 用户体验设计规范

## 使用方式

- **自动应用**: project-structure.mdc 会自动应用于所有AI对话
- **文件类型**: typescript-conventions.mdc 会自动应用于.ts和.tsx文件
- **手动引用**: 其他规则可通过描述手动引用，或由AI根据上下文自动选择

## 规则更新

当项目结构或功能发生变化时，请相应更新这些规则文件以保持准确性。 