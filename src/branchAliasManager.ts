import * as vscode from 'vscode';
import { Repository } from './git';
import { JiraService } from './jira';
import { BranchAliasState } from './state/BranchAliasState';
import { GitRepositoryManager } from './git/GitRepositoryManager';
import { StatusBarManager } from './statusBar/StatusBarManager';

export class BranchAliasManager {
    private state: BranchAliasState;
    public gitManager: GitRepositoryManager;
    private jiraService: JiraService;
    private statusBarManager: StatusBarManager;
    private _onDidChangeAliases: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    readonly onDidChangeAliases: vscode.Event<void> = this._onDidChangeAliases.event;

    constructor(private readonly globalState: vscode.Memento) {
        this.state = new BranchAliasState(globalState);
        this.gitManager = new GitRepositoryManager();
        this.jiraService = new JiraService();
        this.statusBarManager = new StatusBarManager(this.state, this.gitManager);
        this.initialize();
    }

    private async initialize() {
        await this.gitManager.initialize();

        this.gitManager.onDidChangeRepositories(async () => {
            // 检查是否有新分支需要同步JIRA信息
            await this.checkAndSyncMissingAliases();
            this.statusBarManager.updateStatusBar();
        });
    }

    private getBranchKey(branchName: string): string {
        return branchName.replace(/^origin\//, '');
    }

    private async checkAndSyncMissingAliases(): Promise<void> {
        try {
            const jiraKeysToFetch = new Set<string>();
            let hasNewAliases = false;

            // 检查所有仓库的分支
            for (const repo of this.getRepositories()) {
                const repoPath = repo.rootUri.fsPath;
                const branches = await this.gitManager.getActiveBranches(repo, false); // 只检查本地分支
                const existingAliases = this.state.getAliases(repoPath);

                // 找出有JIRA key但没有别名的分支
                for (const branch of branches) {
                    const normalizedBranchName = this.getBranchKey(branch.name);
                    const jiraKey = this.jiraService.extractJiraKey(normalizedBranchName);

                    if (jiraKey && !existingAliases.has(normalizedBranchName)) {
                        jiraKeysToFetch.add(jiraKey);
                    }
                }
            }

            // 如果有需要获取的JIRA信息
            if (jiraKeysToFetch.size > 0) {
                console.log(`${vscode.l10n.t('Detected {0} new branches that need to sync JIRA information', jiraKeysToFetch.size)}: ${Array.from(jiraKeysToFetch).join(', ')}`);

                const summaries = await this.jiraService.getBatchIssueSummaries(Array.from(jiraKeysToFetch));

                // 更新每个仓库的别名
                for (const repo of this.getRepositories()) {
                    const repoPath = repo.rootUri.fsPath;
                    const branches = await this.gitManager.getActiveBranches(repo, false);
                    const existingAliases = this.state.getAliases(repoPath);

                    for (const branch of branches) {
                        const normalizedBranchName = this.getBranchKey(branch.name);
                        const jiraKey = this.jiraService.extractJiraKey(normalizedBranchName);

                        if (jiraKey && summaries[jiraKey] && !existingAliases.has(normalizedBranchName)) {
                            const alias = `${jiraKey}: ${summaries[jiraKey]}`;
                            existingAliases.set(normalizedBranchName, alias);
                            hasNewAliases = true;
                            console.log(`${vscode.l10n.t('Added new alias')}: ${normalizedBranchName} -> ${alias}`);
                        }
                    }

                    this.state.setAliases(repoPath, existingAliases);
                }

                if (hasNewAliases) {
                    await this.state.saveCache();
                    this.refresh();

                    vscode.window.showInformationMessage(
                        vscode.l10n.t('Synced JIRA information for {0} new branches', jiraKeysToFetch.size)
                    );
                }
            }
        } catch (error) {
            console.error(vscode.l10n.t('Error occurred while checking and syncing missing aliases'), error);
        }
    }

    public async refresh(): Promise<void> {
        this._onDidChangeAliases.fire();
        this.statusBarManager.updateStatusBar();
    }

    public async syncWithJira(): Promise<void> {
        const jiraKeys = new Set<string>();

        for (const repo of this.getRepositories()) {
            const branches = await this.gitManager.getActiveBranches(repo, true);
            for (const branch of branches) {
                const normalizedBranchName = this.getBranchKey(branch.name);
                const jiraKey = this.jiraService.extractJiraKey(normalizedBranchName);
                if (jiraKey) {
                    jiraKeys.add(jiraKey);
                }
            }
        }

        const summaries = await this.jiraService.getBatchIssueSummaries(Array.from(jiraKeys));

        for (const repo of this.getRepositories()) {
            const branches = await this.gitManager.getActiveBranches(repo, this.state.getShowRemoteBranches());
            const aliases = new Map<string, string>();

            for (const branch of branches) {
                const normalizedBranchName = this.getBranchKey(branch.name);
                const jiraKey = this.jiraService.extractJiraKey(normalizedBranchName);
                if (jiraKey && summaries[jiraKey]) {
                    aliases.set(normalizedBranchName, `${jiraKey}: ${summaries[jiraKey]}`);
                }
            }

            this.state.setAliases(repo.rootUri.fsPath, aliases);
        }

        await this.state.saveCache();
        this.refresh();
    }

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
            const normalizedBranchName = this.getBranchKey(branch.name);
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