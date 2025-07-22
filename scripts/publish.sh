#!/bin/bash

# VS Code扩展发布脚本
# 用于发布到VS Code Marketplace和Open VSX Registry

set -e

echo "🚀 开始发布VS Code扩展..."

# 检查是否安装了必要的工具
if ! command -v vsce &> /dev/null; then
    echo "❌ vsce未安装，正在安装..."
    npm install -g @vscode/vsce
fi

if ! command -v ovsx &> /dev/null; then
    echo "❌ ovsx未安装，正在安装..."
    npm install -g ovsx
fi

# 检查环境变量
if [ -z "$VSCE_PAT" ] && [ -z "$OVSX_PAT" ]; then
    echo "⚠️  警告：未设置VSCE_PAT或OVSX_PAT环境变量"
    echo "请设置至少一个访问令牌："
    echo "export VSCE_PAT=your-vscode-marketplace-token"
    echo "export OVSX_PAT=your-openvsx-token"
    exit 1
fi

# 编译项目
echo "📦 编译项目..."
npm run compile

# 提取多语言字符串
echo "🌐 提取多语言字符串..."
npm run extract-l10n

# 打包扩展
echo "📦 打包扩展..."
vsce package

# 获取包文件名
PACKAGE_FILE=$(ls *.vsix | head -n 1)
echo "📦 生成的包文件: $PACKAGE_FILE"

# 发布到VS Code Marketplace
if [ ! -z "$VSCE_PAT" ]; then
    echo "🚀 发布到VS Code Marketplace..."
    vsce publish -p $VSCE_PAT
    echo "✅ 成功发布到VS Code Marketplace"
else
    echo "⚠️  跳过VS Code Marketplace发布（未设置VSCE_PAT）"
fi

# 发布到Open VSX Registry
if [ ! -z "$OVSX_PAT" ]; then
    echo "🚀 发布到Open VSX Registry..."
    ovsx publish $PACKAGE_FILE -p $OVSX_PAT
    echo "✅ 成功发布到Open VSX Registry"
else
    echo "⚠️  跳过Open VSX Registry发布（未设置OVSX_PAT）"
fi

echo "🎉 发布完成！"
echo "📦 生成的包文件: $PACKAGE_FILE" 