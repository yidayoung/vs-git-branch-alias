# 国际化实现说明

## 概述

本项目已成功实现了VS Code插件的标准多语言支持，支持中文和英文两种语言。使用了VS Code官方推荐的国际化方案。

## 实现方案

### 1. 使用VS Code官方多语言API

- **vscode.l10n.t API**: 用于代码中的动态字符串翻译（VS Code 1.73+）
- **package.nls.json系列**: 用于package.json中的静态内容翻译
- **@vscode/l10n-dev工具**: 用于提取和管理翻译字符串

### 2. 文件结构

```
├── package.nls.json              # 英文版package.json翻译
├── package.nls.zh-cn.json        # 中文版package.json翻译
├── l10n/
│   ├── bundle.l10n.json          # 英文版代码翻译
│   └── bundle.l10n.zh-cn.json    # 中文版代码翻译
├── README.md                     # 英文版README
├── README.zh-cn.md               # 中文版README
└── src/                          # 源代码使用vscode.l10n.t API
```

### 3. 语言检测

VS Code会根据用户的界面语言自动加载对应的翻译文件：
- 中文用户（zh-cn, zh-tw等）：加载中文翻译
- 其他语言用户：默认使用英文翻译

## 翻译内容

### 静态内容（package.json）

- 插件名称和描述
- 命令标题
- 视图名称
- 配置项描述

### 动态内容（代码中的字符串）

- 状态栏文本和提示
- 错误和信息消息
- 进度提示
- 用户交互反馈

## 脱敏处理

- ✅ 移除了所有`tap4fun`相关内容
- ✅ 使用通用的`your-jira-instance.com`作为示例
- ✅ 将默认分支模式从`X1-\d+`改为`PROJ-\d+`

## 使用方法

### 开发时添加新的翻译字符串

1. 在代码中使用`vscode.l10n.t('Your text here')`
2. 运行`npm run extract-l10n`提取字符串
3. 在`l10n/bundle.l10n.zh-cn.json`中添加中文翻译

### 添加package.json中的新翻译

1. 在package.json中使用`%key%`格式
2. 在`package.nls.json`中添加英文翻译
3. 在`package.nls.zh-cn.json`中添加中文翻译

## 支持的语言

- **English** (默认)
- **中文简体** (zh-cn)

## 扩展支持更多语言

要添加新语言支持：

1. 创建`package.nls.<locale>.json`
2. 创建`l10n/bundle.l10n.<locale>.json`
3. 创建`README.<locale>.md`

例如，添加日语支持：
- `package.nls.ja.json`
- `l10n/bundle.l10n.ja.json`
- `README.ja.md`

## 测试多语言

1. 在VS Code中更改显示语言：
   - 打开命令面板 (Ctrl+Shift+P)
   - 运行 `Configure Display Language`
   - 选择目标语言

2. 重启VS Code以应用语言更改

3. 安装并测试插件在不同语言环境下的表现

## 工具和脚本

- `npm run extract-l10n`: 提取需要翻译的字符串
- `npx vsce package`: 打包插件（包含所有语言文件）

## 注意事项

1. **版本要求**: 需要VS Code 1.73.0+才能使用`vscode.l10n.t` API
2. **字符串格式**: 支持占位符，如`vscode.l10n.t('Hello {0}', name)`
3. **回退机制**: 如果找不到对应语言的翻译，会自动回退到英文
4. **性能**: VS Code会根据用户语言只加载需要的翻译文件，不影响性能

## 文件大小影响

- 添加多语言支持后，插件包大小从684KB增加到696KB
- 增加约12KB，主要是翻译文件和README文件
- 对插件性能无明显影响 