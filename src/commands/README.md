# CommandHandlers 使用指南

## 概述

CommandHandlers 是一个专门用于处理VS Code命令实现的服务，它从extension.ts中提取了复杂的命令逻辑，使主激活函数更加简洁，并提高了代码的可维护性和可测试性。

## 主要功能

- 处理所有VS Code命令的具体实现逻辑
- 提供统一的错误处理和用户反馈
- 通过依赖注入使用其他服务

## 最佳实践

### 1. 在扩展激活时创建

```typescript
export function activate(context: vscode.ExtensionContext) {
    // 创建必要的服务
    const configService = ConfigService.getInstance();
    const syncService = new SyncService(jiraService, gitManager, state);
    const branchAliasManager = new BranchAliasManager(context.globalState, syncService, configService);
    const branchAliasProvider = new BranchAliasProvider(branchAliasManager, gitManager, syncService);
    
    // 创建CommandHandlers实例
    const commandHandlers = new CommandHandlers(
        configService,
        branchAliasManager,
        branchAliasProvider,
        syncService
    );
    
    // 注册命令
    context.subscriptions.push(
        vscode.commands.registerCommand('branchAlias.refresh', () =>
            commandHandlers.handleRefresh()),
        // 其他命令注册...
    );
}
```

### 2. 注册命令

```typescript
// 使用CommandHandlers注册命令
context.subscriptions.push(
    vscode.commands.registerCommand('branchAlias.refresh', () =>
        commandHandlers.handleRefresh()),

    vscode.commands.registerCommand('branchAlias.toggleRemoteBranches', () =>
        commandHandlers.handleToggleRemoteBranches()),

    vscode.commands.registerCommand('branchAlias.toggleRepository', (item) =>
        commandHandlers.handleToggleRepository(item)),

    vscode.commands.registerCommand('branchAlias.openJiraLinks', () =>
        commandHandlers.handleOpenJiraLinks()),

    vscode.commands.registerCommand('branchAlias.openJiraTokenPage', () =>
        commandHandlers.handleOpenJiraTokenPage()),

    vscode.commands.registerCommand('branchAlias.syncWithJira', () =>
        commandHandlers.handleSyncWithJira())
);
```

## API 参考

### 主要方法

- `handleOpenJiraTokenPage()`: 处理打开JIRA令牌生成页面
- `handleRefresh()`: 处理刷新命令
- `handleToggleRemoteBranches()`: 处理切换远程分支显示
- `handleToggleRepository(item)`: 处理切换仓库展开/折叠状态
- `handleOpenJiraLinks()`: 处理打开JIRA链接
- `handleSyncWithJira()`: 处理与JIRA同步

## 错误处理

CommandHandlers 提供了统一的错误处理模式：

1. 使用 try/catch 包装所有命令处理逻辑
2. 显示用户友好的错误消息
3. 在适当的情况下提供恢复操作

示例：
```typescript
try {
    // 命令处理逻辑
} catch (error) {
    vscode.window.showErrorMessage(
        vscode.l10n.t('操作失败: {0}', error instanceof Error ? error.message : String(error))
    );
}
```

## 进度显示

对于长时间运行的操作，CommandHandlers 使用 VS Code 的进度 API 提供反馈：

```typescript
await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: vscode.l10n.t('正在执行操作...'),
    cancellable: false
}, async () => {
    // 长时间运行的操作
});
```

## 国际化

CommandHandlers 使用 VS Code 的 l10n API 进行国际化：

```typescript
vscode.window.showInformationMessage(
    vscode.l10n.t('操作成功完成')
);
```

## 与其他服务的集成

CommandHandlers 通过依赖注入与以下服务集成：

- **ConfigService**: 获取和验证配置
- **BranchAliasManager**: 执行核心别名管理操作
- **BranchAliasProvider**: 更新UI视图
- **SyncService**: 执行JIRA同步操作

## 注意事项

1. 所有命令处理方法都应该是异步的 (async/await)
2. 命令处理应该提供适当的用户反馈
3. 错误处理应该包含恢复建议
4. 长时间运行的操作应该显示进度指示器