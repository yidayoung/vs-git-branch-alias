# Git分支别名

中文 | [English](./README.md)

一个Visual Studio Code扩展插件，用于管理Git分支别名并与JIRA集成。

## 功能特性

- **自动JIRA集成**: 自动从分支名中提取JIRA键并获取Issue标题作为别名
- **多仓库支持**: 管理工作区中多个Git仓库的别名
- **智能状态栏**: 点击状态栏智能打开JIRA链接
- **分支分叉检测**: 自动检测不同仓库的分支差异并打开对应的JIRA链接
- **树视图显示**: 在资源管理器面板中以有组织的树视图显示分支别名
- **多语言支持**: 支持中英文界面

## 安装

1. 打开Visual Studio Code
2. 进入扩展面板 (Ctrl+Shift+X)
3. 搜索 "Git Branch Alias"
4. 点击安装

## 配置

在VS Code设置中配置以下选项：

```json
{
    "branchAlias.jiraBaseUrl": "https://your-jira-instance.com",
    "branchAlias.jiraToken": "your-jira-api-token",
    "branchAlias.branchPattern": ".*_(PROJ-\\d+)"
}
```

### 配置选项

- **`branchAlias.jiraBaseUrl`**: JIRA实例的基础URL
- **`branchAlias.jiraToken`**: 用于身份验证的JIRA API访问令牌
- **`branchAlias.branchPattern`**: 从分支名中提取JIRA键的正则表达式（使用括号标记提取部分）

## 使用方法

### 基本功能

1. **查看分支别名**: 在资源管理器侧边栏打开"Git分支别名"面板
2. **刷新信息**: 点击刷新按钮同步最新的JIRA信息
3. **切换远程分支**: 点击地球图标显示/隐藏远程分支
4. **状态栏集成**: 在状态栏中查看当前分支状态

### 智能JIRA链接打开

点击状态栏中的Git分支信息：

- **单个仓库或相同分支**: 打开一个JIRA链接
- **多个仓库且分支不同**: 打开所有对应的JIRA链接

### 自动同步

扩展会自动：
- 检测新分支并同步JIRA信息
- 在切换分支时更新别名
- 监控仓库变化并更新显示

## 分支命名约定

扩展使用可配置的正则表达式从分支名中提取JIRA键。默认模式：

```
.*_(PROJ-\d+)
```

分支名示例：
- `feature_PROJ-1234` → 提取 `PROJ-1234`
- `bugfix_PROJ-5678_description` → 提取 `PROJ-5678`

## 系统要求

- Visual Studio Code 1.73.0 或更高版本
- 工作区中的Git仓库
- 具有API访问权限的JIRA实例

## 架构

该扩展采用模块化架构，提高可维护性：

- **ConfigService**: 集中配置管理，包含验证和默认值处理
- **SyncService**: 处理所有JIRA同步逻辑
- **CommandHandlers**: 管理命令实现和用户交互
- **GitRepositoryManager**: 管理Git仓库操作
- **StatusBarManager**: 控制状态栏显示和交互
- **BranchAliasManager**: 分支别名管理的核心服务
- **BranchAliasState**: 管理扩展状态持久化

## 扩展命令

- `branchAlias.refresh`: 刷新分支信息
- `branchAlias.toggleRemoteBranches`: 切换远程分支显示
- `branchAlias.toggleRepository`: 展开/折叠仓库视图

## 贡献

1. Fork 仓库
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

本项目基于MIT许可证。

## 更新日志

### 0.0.1

- 首次发布
- 基础JIRA集成
- 多仓库支持
- 状态栏集成
- 多语言支持（中英文） 