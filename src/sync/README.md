# SyncService 使用指南

## 概述

SyncService 是负责处理所有与JIRA同步相关逻辑的服务。它从BranchAliasManager中提取了同步功能，使代码结构更加清晰和模块化。

## 主要功能

- 检查并同步缺失的分支别名
- 与JIRA进行完整同步
- 同步特定仓库的分支信息
- 提供同步结果事件通知

## 最佳实践

### 1. 依赖注入

**✅ 推荐做法：**
```typescript
// 通过依赖注入创建SyncService
const jiraService = JiraService.getInstance(configService);
const syncService = new SyncService(jiraService, gitManager, state);
```

### 2. 监听同步事件

```typescript
// 监听同步完成事件
syncService.onDidSync((result: SyncResult) => {
    if (result.success) {
        console.log(`成功同步了 ${result.syncedCount} 个分支`);
        // 更新UI或显示通知
    } else {
        console.error('同步失败:', result.errors);
        // 显示错误消息
    }
});
```

### 3. 执行同步操作

```typescript
// 检查并同步缺失的别名
await syncService.checkAndSyncMissingAliases();

// 执行完整同步
await syncService.syncWithJira();

// 同步特定仓库
const aliases = await syncService.syncRepository(repository);
```

## API 参考

### 主要方法

- `checkAndSyncMissingAliases()`: 检查并同步缺失的分支别名
- `syncWithJira()`: 与JIRA进行完整同步
- `syncRepository(repository)`: 同步特定仓库的分支信息

### 事件

- `onDidSync`: 同步操作完成时触发的事件

### 同步结果接口

```typescript
interface SyncResult {
    success: boolean;                // 同步是否成功
    syncedCount: number;             // 同步的分支数量
    errors: string[];                // 错误信息列表
    newAliases: Map<string, string>; // 新添加的别名
}
```

## 错误处理

SyncService 内部处理同步过程中可能出现的错误，并通过 `onDidSync` 事件提供详细的错误信息。常见错误包括：

1. JIRA API 连接失败
2. 认证错误
3. 分支模式匹配问题

## 与其他服务的集成

SyncService 与以下服务紧密集成：

- **JiraService**: 提供JIRA API访问
- **GitRepositoryManager**: 提供Git仓库和分支信息
- **BranchAliasState**: 存储和管理别名状态

## 性能优化

1. **批量请求**: 使用批量API请求减少网络调用
2. **增量同步**: `checkAndSyncMissingAliases` 方法只同步新的或缺失别名的分支
3. **事件通知**: 通过事件机制避免轮询检查同步状态

## 注意事项

1. 确保在使用前已正确配置JIRA连接信息
2. 大型仓库可能需要较长的同步时间
3. 网络问题可能导致同步失败，建议实现重试机制