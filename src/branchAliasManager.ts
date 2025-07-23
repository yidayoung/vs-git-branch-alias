import * as vscode from 'vscode';
import { Repository } from './git';
import { BranchAliasState } from './state/BranchAliasState';
import { GitRepositoryManager } from './git/GitRepositoryManager';
import { StatusBarManager } from './statusBar/StatusBarManager';
import { ISyncService, SyncResult } from './sync';
import { ConfigService, IConfigService } from './config';

export class BranchAliasManager {
    public state: BranchAliasState;
    public gitManager: GitRepositoryManager;
    private statusBarManager: StatusBarManager;
    private _onDidChangeAliases: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    readonly onDidChangeAliases: vscode.Event<void> = this._onDidChangeAliases.event;

    constructor(
        globalState: vscode.Memento, 
        private readonly syncService: ISyncService,
        private readonly configService: IConfigService = ConfigService.getInstance(),
        gitManager?: GitRepositoryManager
    ) {
        this.state = new BranchAliasState(globalState);
        this.gitManager = gitManager || new GitRepositoryManager();
        this.statusBarManager = new StatusBarManager(this.state, this.gitManager, this.configService);
        this.initialize();
        
        // Listen for sync events to refresh the UI
        this.syncService.onDidSync(this.handleSyncResult.bind(this));
    }

    private async initialize() {
        // Initialize GitRepositoryManager if needed
        await this.gitManager.initialize();

        this.gitManager.onDidChangeRepositories(async () => {
            // 检查是否有新分支需要同步JIRA信息
            await this.syncService.checkAndSyncMissingAliases();
            this.statusBarManager.updateStatusBar();
        });
    }

    /**
     * Handles the result of a sync operation
     * @param result The result of the sync operation
     */
    private handleSyncResult(result: SyncResult): void {
        if (result.success) {
            if (result.syncedCount > 0) {
                this.refresh();
            }
        } else {
            // Display error notification for failed syncs
            if (result.errors.length > 0) {
                vscode.window.showErrorMessage(
                    vscode.l10n.t('Failed to sync with JIRA: {0}', result.errors[0])
                );
            }
        }
    }

    public async refresh(): Promise<void> {
        this._onDidChangeAliases.fire();
        this.statusBarManager.updateStatusBar();
    }

    // syncWithJira method removed - now handled directly through syncService

    public async toggleRepository(repoPath: string): Promise<void> {
        this.state.toggleRepository(repoPath);
        await this.state.saveExpandedRepos();
        this.refresh();
    }

    public async toggleRemoteBranches(): Promise<void> {
        this.state.setShowRemoteBranches(!this.state.getShowRemoteBranches());
        await this.state.saveRemoteState();
        this.refresh();
    }

    public dispose() {
        this.gitManager.dispose();
        this.statusBarManager.dispose();
    }

    public getRepositories(): Repository[] {
        return this.gitManager.getRepositories();
    }

    public isRepositoryExpanded(repoPath: string): boolean {
        return this.state.isRepositoryExpanded(repoPath);
    }

    public async getAliases(repoPath: string): Promise<Map<string, string>> {
        const repo = this.getRepositories().find(r => r.rootUri.fsPath === repoPath);
        if (!repo) {
            return new Map<string, string>();
        }

        const branches = await this.gitManager.getActiveBranches(repo, this.state.getShowRemoteBranches());
        const storedAliases = this.state.getAliases(repoPath);

        const branchesWithAlias: [string, string][] = [];
        const branchesWithoutAlias: [string, string][] = [];

        for (const branch of branches) {
            // Normalize branch name (remove remote prefix)
            const normalizedBranchName = branch.name.replace(/^origin\//, '');
            const alias = storedAliases.get(normalizedBranchName);

            if (alias) {
                branchesWithAlias.push([normalizedBranchName, alias]);
            } else {
                branchesWithoutAlias.push([normalizedBranchName, normalizedBranchName]);
            }
        }

        branchesWithAlias.sort((a, b) => a[0].localeCompare(b[0]));
        branchesWithoutAlias.sort((a, b) => a[0].localeCompare(b[0]));

        return new Map([...branchesWithAlias, ...branchesWithoutAlias]);
    }

    public async handleStatusBarClick(): Promise<void> {
        return this.statusBarManager.handleStatusBarClick();
    }
} 