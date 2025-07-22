import * as vscode from 'vscode';
import { BranchAliasManager } from './branchAliasManager';
import { BranchAliasProvider, RepositoryItem } from './branchAliasProvider';

export function activate(context: vscode.ExtensionContext) {
    const branchAliasManager = new BranchAliasManager(context.globalState);
    const branchAliasProvider = new BranchAliasProvider(branchAliasManager, branchAliasManager.gitManager);

    const treeView = vscode.window.createTreeView('branchAliases', {
        treeDataProvider: branchAliasProvider,
        showCollapseAll: true
    });

    context.subscriptions.push(
        vscode.commands.registerCommand('branchAlias.refresh', () => {
            branchAliasProvider.forceRefresh();
        }),

        vscode.commands.registerCommand('branchAlias.toggleRemoteBranches', async () => {
            await branchAliasManager.toggleRemoteBranches();
            branchAliasProvider.refresh();
        }),

        vscode.commands.registerCommand('branchAlias.toggleRepository', async (item: RepositoryItem) => {
            await branchAliasManager.toggleRepository(item.repository.rootUri.fsPath);
            branchAliasProvider.refresh();
        }),

        vscode.commands.registerCommand('branchAlias.openJiraLinks', async () => {
            await branchAliasManager.handleStatusBarClick();
        }),

        vscode.commands.registerCommand('branchAlias.openJiraTokenPage', async () => {
            const config = vscode.workspace.getConfiguration('branchAlias');
            const jiraBaseUrl = config.get<string>('jiraBaseUrl', 'https://your-jira-instance.com');

            // 检查是否配置了有效的JIRA URL
            if (jiraBaseUrl === 'https://your-jira-instance.com') {
                const result = await vscode.window.showWarningMessage(
                    '请先配置JIRA基础URL，然后再生成令牌',
                    '打开设置'
                );
                if (result === '打开设置') {
                    await vscode.commands.executeCommand('workbench.action.openSettings', 'branchAlias.jiraBaseUrl');
                }
                return;
            }

            // 构造JIRA API Token生成页面的URL
            const tokenUrl = `${jiraBaseUrl.replace(/\/$/, '')}/secure/ViewProfile.jspa?selectedTab=com.atlassian.pats.pats-plugin:jira-user-personal-access-tokens`;

            try {
                // 显示进度提示
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "正在打开JIRA令牌生成页面...",
                    cancellable: false
                }, async () => {
                    await vscode.env.openExternal(vscode.Uri.parse(tokenUrl));
                    // 短暂延迟以显示进度
                    await new Promise(resolve => setTimeout(resolve, 1000));
                });

                // 显示成功消息和后续步骤提示
                const result = await vscode.window.showInformationMessage(
                    '已在浏览器中打开JIRA令牌生成页面。生成令牌后，请复制并粘贴到设置中。',
                    '打开令牌设置'
                );

                if (result === '打开令牌设置') {
                    await vscode.commands.executeCommand('workbench.action.openSettings', 'branchAlias.jiraToken');
                }

            } catch (error) {
                vscode.window.showErrorMessage(`无法打开JIRA令牌生成页面: ${error}`);
            }
        })
    );
}

export function deactivate() { } 