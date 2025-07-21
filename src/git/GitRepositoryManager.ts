import * as vscode from 'vscode';
import { GitExtension, Repository, Ref } from '../git';

export class GitRepositoryManager {
    private repositories: Repository[] = [];
    private disposables: vscode.Disposable[] = [];
    private repositoryStateListeners = new Map<string, vscode.Disposable>();
    private _onDidChangeRepositories = new vscode.EventEmitter<void>();
    readonly onDidChangeRepositories = this._onDidChangeRepositories.event;
    private git: any;

    constructor() { }

    async initialize(): Promise<void> {
        try {
            const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git');
            if (!gitExtension) {
                return;
            }

            await gitExtension.activate();
            this.git = gitExtension.exports.getAPI(1);

            this.setupRepositoryListeners();
            this.syncRepositories();

        } catch (error) {
            // 静默处理错误
        }
    }

    private setupRepositoryListeners() {
        this.disposables.push(
            this.git.onDidOpenRepository(() => {
                this.syncRepositories();
            })
        );

        this.disposables.push(
            this.git.onDidCloseRepository(() => {
                this.syncRepositories();
            })
        );
    }

    private syncRepositories() {
        // 清理旧的状态监听器
        this.repositoryStateListeners.forEach(listener => listener.dispose());
        this.repositoryStateListeners.clear();

        // 更新仓库列表
        this.repositories = [...this.git.repositories];

        // 为每个仓库设置状态监听器
        this.repositories.forEach(repo => {
            this.setupRepositoryStateListener(repo);
        });

        this._onDidChangeRepositories.fire();
    }

    private setupRepositoryStateListener(repo: Repository) {
        const repoPath = repo.rootUri.fsPath;

        const listener = repo.state.onDidChange(() => {
            this._onDidChangeRepositories.fire();
        });

        this.repositoryStateListeners.set(repoPath, listener);
        this.disposables.push(listener);
    }

    async getActiveBranches(repo: Repository, showRemote: boolean): Promise<Ref[]> {
        if (showRemote) {
            await repo.fetch();
            const remoteBranches = await repo.getBranches({
                remote: true,
                pattern: 'refs/remotes/origin/*'
            });
            return remoteBranches.filter(branch =>
                branch.remote && !branch.upstream?.gone
            );
        } else {
            return await repo.getBranches({ remote: false });
        }
    }

    getRepositories(): Repository[] {
        return this.repositories;
    }

    async forceRefreshRepositories(): Promise<void> {
        if (this.git) {
            this.syncRepositories();
        }
    }

    dispose() {
        this.disposables.forEach(d => d.dispose());
        this.repositoryStateListeners.forEach(listener => listener.dispose());
        this.repositoryStateListeners.clear();
        this._onDidChangeRepositories.dispose();
    }
} 