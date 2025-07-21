# VS Code插件发布指南

## 🚀 发布到Visual Studio Code Marketplace

### 1. 准备工作

#### 1.1 安装vsce工具
```bash
npm install -g @vscode/vsce
```

#### 1.2 创建Azure DevOps账户
1. 访问 [Azure DevOps](https://dev.azure.com/)
2. 使用您的Microsoft账户登录（可以使用GitHub账户关联）
3. 创建一个组织（如果还没有的话）

#### 1.3 创建Personal Access Token (PAT)
1. 在Azure DevOps中，点击右上角的用户图标
2. 选择 "Personal access tokens"
3. 点击 "New Token"
4. 配置令牌：
   - **Name**: `vscode-marketplace-publish`
   - **Organization**: 选择您的组织
   - **Expiration**: 选择合适的过期时间
   - **Scopes**: 选择 "Custom defined" 然后选择：
     - **Marketplace**: `Acquire` 和 `Manage`
5. 点击 "Create" 并**保存生成的令牌**（只会显示一次）

#### 1.4 创建发布者账户
1. 访问 [Visual Studio Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
2. 点击 "Create publisher"
3. 填写信息：
   - **Publisher ID**: `yidayoung` （与package.json中的publisher字段一致）
   - **Publisher name**: `YidaYoung`
   - **Email**: 您的邮箱地址

### 2. 配置vsce

#### 2.1 登录vsce
```bash
vsce login yidayoung
```
输入您的Personal Access Token

#### 2.2 验证配置
```bash
vsce ls-publishers
```

### 3. 准备发布

#### 3.1 更新版本号
在 `package.json` 中更新版本号：
```json
{
  "version": "1.0.0"
}
```

#### 3.2 最终检查
```bash
# 编译项目
npm run compile

# 提取最新的多语言字符串
npm run extract-l10n

# 打包测试
vsce package
```

### 4. 发布插件

#### 4.1 发布到Marketplace
```bash
vsce publish
```

或者指定版本：
```bash
vsce publish 1.0.0
```

#### 4.2 发布预发布版本
```bash
vsce publish --pre-release
```

### 5. 更新发布

#### 5.1 补丁版本更新
```bash
vsce publish patch  # 1.0.0 -> 1.0.1
```

#### 5.2 小版本更新
```bash
vsce publish minor  # 1.0.0 -> 1.1.0
```

#### 5.3 大版本更新
```bash
vsce publish major  # 1.0.0 -> 2.0.0
```

## 📦 发布到Open VSX Registry (可选)

Open VSX是一个开源的扩展注册中心，用于VS Code的开源版本。

### 1. 安装ovsx工具
```bash
npm install -g ovsx
```

### 2. 创建账户
1. 访问 [Open VSX Registry](https://open-vsx.org/)
2. 使用GitHub账户登录
3. 创建Access Token

### 3. 发布
```bash
ovsx publish -p <your-access-token>
```

## 🔄 自动化发布 (GitHub Actions)

创建 `.github/workflows/publish.yml`:

```yaml
name: Publish Extension

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Compile
      run: npm run compile
      
    - name: Extract l10n
      run: npm run extract-l10n
      
    - name: Publish to VS Code Marketplace
      run: npx vsce publish
      env:
        VSCE_PAT: ${{ secrets.VSCE_PAT }}
        
    - name: Publish to Open VSX
      run: npx ovsx publish
      env:
        OVSX_PAT: ${{ secrets.OVSX_PAT }}
```

## 📋 发布前检查清单

- [ ] 版本号已更新
- [ ] README文档完整且准确
- [ ] 所有功能经过测试
- [ ] 多语言翻译完整
- [ ] 没有敏感信息（API密钥等）
- [ ] package.json中的信息准确
- [ ] 代码已编译且无错误
- [ ] 插件图标已添加（推荐）
- [ ] LICENSE文件已添加

## 🎯 发布后

### 1. 验证发布
- 在VS Code中搜索您的插件
- 测试安装和基本功能
- 检查Marketplace页面显示

### 2. 推广
- 在GitHub README中添加Marketplace徽章：
```markdown
[![Visual Studio Marketplace](https://img.shields.io/vscode-marketplace/v/yidayoung.git-branch-alias.svg)](https://marketplace.visualstudio.com/items?itemName=yidayoung.git-branch-alias)
```

### 3. 监控
- 关注下载量和评分
- 回应用户反馈和问题
- 定期更新和维护

## ❗ 重要提示

1. **Personal Access Token安全**：永远不要在代码中暴露PAT
2. **版本管理**：遵循语义化版本控制
3. **测试**：发布前在不同环境中测试
4. **文档**：保持README和CHANGELOG更新
5. **许可证**：确保包含适当的许可证文件

## 🆘 常见问题

### Q: 发布失败，提示"publisher not found"
A: 确保在Marketplace中创建了对应的publisher账户

### Q: 如何撤回已发布的版本？
A: 使用 `vsce unpublish` 命令，但这会影响已安装的用户

### Q: 如何更新插件描述？
A: 更新package.json中的description字段，然后重新发布

### Q: 支持哪些文件格式的图标？
A: 推荐使用128x128的PNG格式图标

需要帮助？查看 [官方文档](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) 或在GitHub Issues中提问。 