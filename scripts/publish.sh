#!/bin/bash

# VS Code扩展发布脚本
# 支持发布到 VS Code Marketplace 和 Open VSX Registry

set -e

echo "🚀 开始发布 VS Code 扩展..."

# 检查环境变量
if [ -z "$VSCE_PAT" ] && [ -z "$OVSX_PAT" ]; then
    echo "⚠️  警告：未设置发布令牌"
    echo "请设置环境变量："
    echo "  export VSCE_PAT=your-vscode-marketplace-token"
    echo "  export OVSX_PAT=your-openvsx-token"
    echo ""
fi

# 构建项目
echo "📦 构建项目..."
npm run vscode:prepublish

# 提取多语言字符串
echo "🌐 提取多语言字符串..."
npm run extract-l10n

# 打包扩展
echo "📦 打包扩展..."
npm run package

# 获取包文件名
PACKAGE_FILE=$(ls *.vsix | head -n 1)
echo "📦 生成的包文件: $PACKAGE_FILE"

# 发布到 VS Code Marketplace
if [ ! -z "$VSCE_PAT" ]; then
    echo "🚀 发布到 VS Code Marketplace..."
    npm run publish:marketplace
    echo "✅ 成功发布到 VS Code Marketplace"
else
    echo "⚠️  跳过 VS Code Marketplace 发布（未设置 VSCE_PAT）"
fi

# 发布到 Open VSX Registry
if [ ! -z "$OVSX_PAT" ]; then
    echo "🚀 发布到 Open VSX Registry..."
    npm run publish:openvsx
    echo "✅ 成功发布到 Open VSX Registry"
else
    echo "⚠️  跳过 Open VSX Registry 发布（未设置 OVSX_PAT）"
fi

echo "🎉 发布完成！"
echo "📦 包文件: $PACKAGE_FILE" 