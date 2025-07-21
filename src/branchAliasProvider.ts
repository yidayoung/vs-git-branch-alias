import * as vscode from 'vscode';
import { BranchAliasManager } from './branchAliasManager';
import { Repository } from './git';
import { GitRepositoryManager } from './git/GitRepositoryManager';

export class BranchAliasProvider implements vscode.TreeDataProvider<BranchAliasItem | RepositoryItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<BranchAliasItem | RepositoryItem | undefined> = new vscode.EventEmitter<BranchAliasItem | RepositoryItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<BranchAliasItem | RepositoryItem | undefined> = this._onDidChangeTreeData.event;

    constructor(
        private branchAliasManager: BranchAliasManager,
        private gitManager: GitRepositoryManager
    ) {
        branchAliasManager.onDidChangeAliases(() => {
            this.refresh();
        });
        gitManager.onDidChangeRepositories(() => {
            this._onDidChangeTreeData.fire(undefined);
        });
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    async forceRefresh(): Promise<void> {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: vscode.l10n.t('Refreshing branch information...'),
            cancellable: false
        }, async () => {
            // 首先强制刷新仓库列表
            await this.gitManager.forceRefreshRepositories();
            // 然后同步JIRA信息
            await this.branchAliasManager.syncWithJira();
            this.refresh();
        });
    }

    getTreeItem(element: BranchAliasItem | RepositoryItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: BranchAliasItem | RepositoryItem): Promise<(BranchAliasItem | RepositoryItem)[]> {
        if (!element) {
            const repositories = this.branchAliasManager.getRepositories();
            return repositories.map(repo => new RepositoryItem(
                repo,
                this.branchAliasManager.isRepositoryExpanded(repo.rootUri.fsPath)
            ));
        }

        if (element instanceof RepositoryItem) {
            const repoPath = element.repository.rootUri.fsPath;

            if (!this.branchAliasManager.isRepositoryExpanded(repoPath)) {
                await this.branchAliasManager.toggleRepository(repoPath);
            }

            const aliases = await this.branchAliasManager.getAliases(repoPath);
            return Array.from(aliases.entries()).map(([branch, alias]) =>
                new BranchAliasItem(branch, alias)
            );
        }

        return [];
    }
}

export class BranchAliasItem extends vscode.TreeItem {
    constructor(
        public readonly branch: string,
        public readonly alias: string
    ) {
        super(alias);
        this.tooltip = `${branch}\n${alias}`;
        this.description = branch;
    }
}

export class RepositoryItem extends vscode.TreeItem {
    constructor(
        public readonly repository: Repository,
        expanded: boolean
    ) {
        // 只显示文件夹名字
        const label = repository.rootUri.path.split('/').pop() || 'unknown';
        super(label, expanded ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed);

        this.contextValue = 'repository';
        this.iconPath = new vscode.ThemeIcon('repo');
        // tooltip显示完整路径
        this.tooltip = vscode.workspace.asRelativePath(repository.rootUri);
    }
} 