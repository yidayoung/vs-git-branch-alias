# 发布指南

## 打包优化

为了减小最终扩展包的大小，我们使用了以下策略：

### 1. 使用 esbuild 打包

我们使用 esbuild 将所有源代码和依赖打包成单个 JavaScript 文件，这样可以减少文件数量并优化加载时间。

```json
"scripts": {
    "vscode:prepublish": "npm run esbuild-base -- --minify",
    "esbuild-base": "esbuild ./src/extension.ts --bundle --outfile=out/extension.js --external:vscode --format=cjs --platform=node"
}
```

### 2. .vscodeignore 配置

我们使用 .vscodeignore 文件来排除不需要包含在最终扩展包中的文件：

- 源代码文件（已经被打包到 extension.js）
- 开发工具和配置文件
- 测试文件
- 文档文件（除了主要的 README）
- 构建产物（除了最终的 extension.js）

### 3. 依赖管理

- 将 VS Code API 标记为外部依赖（`--external:vscode`）
- 只包含必要的生产依赖
- 使用轻量级的依赖

## 发布流程

### 准备发布

1. 更新版本号：
   ```bash
   npm version patch|minor|major
   ```

2. 更新 CHANGELOG.md

3. 构建扩展：
   ```bash
   npm run vscode:prepublish
   ```

4. 打包扩展：
   ```bash
   npm run package
   ```

### 发布到 VS Code Marketplace

```bash
npm run publish:marketplace
```

### 发布到 Open VSX Registry

```bash
npm run publish:openvsx
```

## 包大小监控

当前扩展包大小约为 246.76 KB。如果包大小超过 300 KB，应该考虑进一步优化：

1. 检查依赖项，移除不必要的依赖
2. 使用更轻量级的替代库
3. 检查是否有大型资源文件被意外包含
4. 考虑使用 webpack 的 tree-shaking 功能

## 常见问题

### 包大小过大

如果包大小过大，可能是因为：

1. node_modules 没有被正确排除
2. 大型资源文件被包含
3. 源代码和源映射文件被包含

解决方法：
- 检查 .vscodeignore 文件
- 使用 `vsce ls` 命令查看将被包含的文件
- 确保 esbuild 配置正确

### 依赖问题

如果遇到依赖问题：

1. 确保所有依赖都在 package.json 中声明
2. 检查是否有冲突的依赖版本
3. 考虑使用 npm audit 修复安全问题

## 最佳实践

1. 定期更新依赖以修复安全漏洞
2. 在发布前测试扩展在不同版本的 VS Code 中的兼容性
3. 确保国际化文件正确包含
4. 使用语义化版本控制