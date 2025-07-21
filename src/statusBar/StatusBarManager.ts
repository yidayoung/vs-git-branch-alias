import * as vscode from 'vscode';
import { BranchAliasState } from '../state/BranchAliasState';
import { GitRepositoryManager } from '../git/GitRepositoryManager';
import { JiraService } from '../jira/JiraService';

export class StatusBarManager {
    private statusBarItem: vscode.StatusBarItem;
    private disposables: vscode.Disposable[] = [];
    private jiraService: JiraService;

    constructor(
        private readonly state: BranchAliasState,
        private readonly gitManager: GitRepositoryManager
    ) {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this.jiraService = new JiraService();
        this.setupEventListeners();
        this.updateStatusBar();
    }

    private setupEventListeners() {
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('branchAlias.showRemoteBranches')) {
                    this.updateStatusBar();
                }
            })
        );
    }

    private async getAllRepositoriesBranchInfo(): Promise<Array<{ repoName: string, branch?: string, alias?: string }>> {
        const repositories = this.gitManager.getRepositories();
        const branchInfos: Array<{ repoName: string, branch?: string, alias?: string }> = [];

        for (const repo of repositories) {
            const repoName = repo.rootUri.path.split('/').pop() || 'unknown';

            if (!repo.state.HEAD?.name) {
                branchInfos.push({ repoName, branch: undefined, alias: undefined });
                continue;
            }

            const branch = repo.state.HEAD.name;
            const normalizedBranchName = this.getBranchKey(branch);
            const repoPath = repo.rootUri.fsPath;
            const aliases = this.state.getAliases(repoPath);
            const alias = aliases.get(normalizedBranchName);

            branchInfos.push({ repoName, branch, alias });
        }

        return branchInfos;
    }

    private getBranchKey(branchName: string): string {
        return branchName.replace(/^origin\//, '');
    }

    public async updateStatusBar() {
        const branchInfos = await this.getAllRepositoriesBranchInfo();

        if (branchInfos.length === 0) {
            this.statusBarItem.text = `$(git-branch) ${vscode.l10n.t('No Repository')}`;
            this.statusBarItem.tooltip = vscode.l10n.t('No Git repository found');
            this.statusBarItem.command = undefined;
            this.statusBarItem.show();
            return;
        }

        // 按分支名/别名分组
        const branchGroups = new Map<string, { repos: string[], branch?: string, alias?: string }>();

        for (const { repoName, branch, alias } of branchInfos) {
            const displayText = alias || branch || vscode.l10n.t('Unknown Branch');

            if (!branchGroups.has(displayText)) {
                branchGroups.set(displayText, { repos: [], branch, alias });
            }

            branchGroups.get(displayText)!.repos.push(repoName);
        }

        const statusTexts: string[] = [];
        const tooltipLines: string[] = [];

        for (const [displayText, { repos, branch, alias }] of branchGroups) {
            if (repos.length === 1) {
                statusTexts.push(`${repos[0]}: ${displayText}`);
                if (branch) {
                    if (alias) {
                        tooltipLines.push(`${repos[0]} - ${vscode.l10n.t('Branch')}: ${branch}`);
                    } else {
                        tooltipLines.push(`${repos[0]} - ${vscode.l10n.t('Branch')}: ${branch} ${vscode.l10n.t('(No alias found)')}`);
                    }
                } else {
                    tooltipLines.push(`${repos[0]} - ${vscode.l10n.t('No corresponding Git branch found')}`);
                }
            } else {
                statusTexts.push(`[${repos.join(',')}]: ${displayText}`);
                if (branch) {
                    if (alias) {
                        tooltipLines.push(`${repos.join(', ')} - ${vscode.l10n.t('Branch')}: ${branch}`);
                    } else {
                        tooltipLines.push(`${repos.join(', ')} - ${vscode.l10n.t('Branch')}: ${branch} ${vscode.l10n.t('(No alias found)')}`);
                    }
                } else {
                    tooltipLines.push(`${repos.join(', ')} - ${vscode.l10n.t('No corresponding Git branch found')}`);
                }
            }
        }

        this.statusBarItem.text = `$(git-branch) ${statusTexts.join(' | ')}`;
        this.statusBarItem.tooltip = tooltipLines.join('\n') + '\n\n' + vscode.l10n.t('Click to open corresponding JIRA links');
        this.statusBarItem.command = 'branchAlias.openJiraLinks';
        this.statusBarItem.show();
    }

    public async handleStatusBarClick(): Promise<void> {
        const branchInfos = await this.getAllRepositoriesBranchInfo();

        if (branchInfos.length === 0) {
            vscode.window.showInformationMessage(vscode.l10n.t('No Git repository found'));
            return;
        }

        // 收集所有有效的Jira链接
        const jiraLinks = new Set<string>();
        const uniqueBranches = new Set<string>();

        for (const { branch } of branchInfos) {
            if (branch) {
                uniqueBranches.add(branch);
                const normalizedBranchName = this.getBranchKey(branch);
                const jiraKey = this.jiraService.extractJiraKey(normalizedBranchName);

                if (jiraKey) {
                    const jiraUrl = this.jiraService.getJiraUrl(jiraKey);
                    if (jiraUrl) {
                        jiraLinks.add(jiraUrl);
                    }
                }
            }
        }

        if (jiraLinks.size === 0) {
            vscode.window.showInformationMessage(vscode.l10n.t('No corresponding JIRA issue found for current branch'));
            return;
        }

        // 判断是否有分叉（不同分支）
        const hasDifferentBranches = uniqueBranches.size > 1;

        if (hasDifferentBranches) {
            // 有分叉，打开所有JIRA链接
            vscode.window.showInformationMessage(
                vscode.l10n.t('Found {0} different branches, opening {1} JIRA links', uniqueBranches.size, jiraLinks.size)
            );

            for (const link of jiraLinks) {
                vscode.env.openExternal(vscode.Uri.parse(link));
            }
        } else {
            // 没有分叉，只打开一个链接
            const link = Array.from(jiraLinks)[0];
            vscode.env.openExternal(vscode.Uri.parse(link));
        }
    }

    public dispose() {
        this.statusBarItem.dispose();
        this.disposables.forEach(d => d.dispose());
    }
} 