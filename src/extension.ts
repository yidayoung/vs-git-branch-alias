import * as vscode from 'vscode';
import { BranchAliasManager } from './branchAliasManager';
import { BranchAliasProvider } from './branchAliasProvider';
import { ConfigService } from './config';
import { CommandHandlers } from './commands/CommandHandlers';
import { JiraService } from './jira';
import { BranchAliasState } from './state/BranchAliasState';
import { SyncService } from './sync';
import { GitRepositoryManager } from './git/GitRepositoryManager';

export async function activate(context: vscode.ExtensionContext) {
    // Get singleton ConfigService instance
    const configService = ConfigService.getInstance();
    context.subscriptions.push(configService);

    // Create state instance
    const state = new BranchAliasState(context.globalState);

    // Create GitRepositoryManager
    const gitManager = new GitRepositoryManager();
    // Initialize GitRepositoryManager
    await gitManager.initialize();

    // Create JiraService
    const jiraService = JiraService.getInstance(configService);

    // Create SyncService
    const syncService = new SyncService(jiraService, gitManager, state);

    // Create BranchAliasManager with injected dependencies
    const branchAliasManager = new BranchAliasManager(context.globalState, syncService, configService, gitManager);
    const branchAliasProvider = new BranchAliasProvider(branchAliasManager, branchAliasManager.gitManager, syncService);

    // Create CommandHandlers instance
    const commandHandlers = new CommandHandlers(
        configService,
        branchAliasManager,
        branchAliasProvider,
        syncService
    );

    // Create tree view
    const treeView = vscode.window.createTreeView('branchAliases', {
        treeDataProvider: branchAliasProvider,
        showCollapseAll: true
    });
    context.subscriptions.push(treeView);

    // Register commands using CommandHandlers
    context.subscriptions.push(
        vscode.commands.registerCommand('branchAlias.refresh', () =>
            commandHandlers.handleRefresh()),

        vscode.commands.registerCommand('branchAlias.toggleRemoteBranches', () =>
            commandHandlers.handleToggleRemoteBranches()),

        vscode.commands.registerCommand('branchAlias.toggleRepository', (item) =>
            commandHandlers.handleToggleRepository(item)),

        vscode.commands.registerCommand('branchAlias.openJiraLinks', () =>
            commandHandlers.handleOpenJiraLinks()),

        vscode.commands.registerCommand('branchAlias.openJiraTokenPage', () =>
            commandHandlers.handleOpenJiraTokenPage()),

        vscode.commands.registerCommand('branchAlias.syncWithJira', () =>
            commandHandlers.handleSyncWithJira())
    );
}

export function deactivate() { } 