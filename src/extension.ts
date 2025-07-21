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
        })
    );
}

export function deactivate() { } 