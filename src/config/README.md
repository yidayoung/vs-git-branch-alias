# ConfigService 使用指南

## 概述

ConfigService 是一个统一的配置管理服务，提供了缓存、验证和变更监听功能。它采用单例模式，确保在整个扩展生命周期中只有一个实例。

## 最佳实践

### 1. 使用单例实例

**❌ 错误做法：**
```typescript
// 每次都创建新实例
const configService = new ConfigService();
const baseUrl = configService.getJiraBaseUrl();
configService.dispose(); // 需要手动管理生命周期
```

**✅ 正确做法：**
```typescript
// 使用单例实例
const configService = ConfigService.getInstance();
const baseUrl = configService.getJiraBaseUrl();
// 不需要手动 dispose，由扩展生命周期管理
```

### 2. 在扩展激活时注册

```typescript
export function activate(context: vscode.ExtensionContext) {
    // 获取单例实例并注册到扩展上下文
    const configService = ConfigService.getInstance();
    context.subscriptions.push(configService);
    
    // 其他初始化代码...
}
```

### 3. 监听配置变更

```typescript
const configService = ConfigService.getInstance();

// 注册配置变更监听器
const disposable = configService.onConfigurationChanged(() => {
    console.log('Configuration changed, updating...');
    // 处理配置变更
});

// 在适当的时候取消监听（通常由扩展生命周期管理）
// disposable.dispose();
```

### 4. 配置验证

```typescript
const configService = ConfigService.getInstance();
const validation = configService.validateJiraConfig();

if (!validation.isValid) {
    console.error('Configuration errors:', validation.errors);
    // 显示错误消息给用户
}

if (validation.warnings.length > 0) {
    console.warn('Configuration warnings:', validation.warnings);
    // 显示警告消息给用户
}
```

### 5. 在其他服务中使用

```typescript
import { ConfigService } from '../config';

export class SomeService {
    private configService: ConfigService;
    
    constructor() {
        this.configService = ConfigService.getInstance();
        
        // 监听配置变更
        this.configService.onConfigurationChanged(() => {
            this.handleConfigChange();
        });
    }
    
    private handleConfigChange(): void {
        // 配置变更时的处理逻辑
        const newConfig = this.configService.getJiraConfig();
        // 更新服务状态...
    }
    
    public someMethod(): void {
        const baseUrl = this.configService.getJiraBaseUrl();
        const token = this.configService.getJiraToken();
        // 使用配置...
    }
}
```

## API 参考

### 主要方法

- `getInstance()`: 获取单例实例
- `getJiraBaseUrl()`: 获取 JIRA 基础 URL
- `getJiraToken()`: 获取 JIRA 令牌
- `getBranchPattern()`: 获取分支模式
- `getJiraConfig()`: 获取完整的 JIRA 配置
- `validateJiraConfig()`: 验证配置
- `onConfigurationChanged(listener)`: 监听配置变更

### 配置验证结果

```typescript
interface ConfigValidationResult {
    isValid: boolean;      // 配置是否有效
    errors: string[];      // 错误列表
    warnings: string[];    // 警告列表
}
```

## 性能优化

1. **缓存机制**: ConfigService 内部使用缓存，避免重复读取配置
2. **单例模式**: 确保整个扩展只有一个实例，避免重复初始化
3. **事件监听**: 只在配置真正变更时才触发更新，避免不必要的处理

## 测试

使用 `runConfigServiceTests()` 函数可以运行基本的功能测试：

```typescript
import { runConfigServiceTests } from './config';

// 在开发或调试时运行测试
runConfigServiceTests();
```

## 注意事项

1. 不要直接使用 `new ConfigService()`，始终使用 `getInstance()`
2. 配置变更监听器会自动在扩展卸载时清理，无需手动管理
3. 在测试环境中可以使用 `ConfigService.resetInstance()` 重置单例状态