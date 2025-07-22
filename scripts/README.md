# 发布脚本说明

## 使用方法

### 1. 设置环境变量

在使用发布脚本前，需要设置相应的环境变量：

```bash
# VS Code Marketplace Personal Access Token
export VSCE_PAT=your-vscode-marketplace-token

# Open VSX Registry Personal Access Token  
export OVSX_PAT=your-openvsx-token
```

### 2. 运行发布脚本

```bash
# 完整发布流程（构建 + 打包 + 发布）
npm run publish

# 或者分步执行
npm run package              # 仅打包
npm run publish:marketplace  # 仅发布到 VS Code Marketplace
npm run publish:openvsx      # 仅发布到 Open VSX Registry
```

## 发布令牌获取

### VS Code Marketplace (VSCE_PAT)

1. 访问 [Azure DevOps](https://dev.azure.com/)
2. 创建 Personal Access Token
3. 权限选择：Marketplace -> Manage

### Open VSX Registry (OVSX_PAT)

1. 访问 [Open VSX](https://open-vsx.org/)
2. 登录后进入 Settings
3. 创建 Access Token

## 脚本功能

`publish.sh` 脚本会自动执行以下步骤：

1. 📦 构建项目 (esbuild)
2. 🌐 提取多语言字符串
3. 📦 打包扩展 (.vsix)
4. 🚀 发布到 VS Code Marketplace（如果设置了 VSCE_PAT）
5. 🚀 发布到 Open VSX Registry（如果设置了 OVSX_PAT）

如果没有设置令牌，脚本会跳过相应的发布步骤，只进行构建和打包。 