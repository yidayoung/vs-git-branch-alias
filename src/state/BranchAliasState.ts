import * as vscode from 'vscode';

export class BranchAliasState {
    private static readonly CACHE_KEY = 'branchAliasCache';
    private static readonly EXPANDED_REPOS_KEY = 'branchAliasExpandedRepos';
    private static readonly REMOTE_STATE_KEY = 'branchAliasShowRemote';

    private aliasesByRepo: Map<string, Map<string, string>> = new Map();
    private expandedRepos: Set<string> = new Set();
    private showRemoteBranches: boolean = false;

    constructor(private readonly globalState: vscode.Memento) {
        this.loadState();
    }

    private loadState() {
        this.loadCache();
        this.loadExpandedRepos();
        this.loadRemoteState();
    }

    private loadCache() {
        const cache = this.globalState.get<Record<string, Record<string, string>>>(BranchAliasState.CACHE_KEY, {});
        this.aliasesByRepo = new Map(
            Object.entries(cache).map(([repoPath, repoAliases]) =>
                [repoPath, new Map(Object.entries(repoAliases))]
            )
        );
    }

    async saveCache() {
        const cache = Object.fromEntries(
            Array.from(this.aliasesByRepo.entries()).map(([repoPath, aliasMap]) => [
                repoPath,
                Object.fromEntries(aliasMap)
            ])
        );
        await this.globalState.update(BranchAliasState.CACHE_KEY, cache);
    }

    private loadExpandedRepos() {
        const expanded = this.globalState.get<string[]>(BranchAliasState.EXPANDED_REPOS_KEY, []);
        this.expandedRepos = new Set(expanded);
    }

    async saveExpandedRepos() {
        await this.globalState.update(
            BranchAliasState.EXPANDED_REPOS_KEY,
            Array.from(this.expandedRepos)
        );
    }

    private loadRemoteState() {
        this.showRemoteBranches = this.globalState.get<boolean>(BranchAliasState.REMOTE_STATE_KEY, false);
    }

    async saveRemoteState() {
        await this.globalState.update(BranchAliasState.REMOTE_STATE_KEY, this.showRemoteBranches);
    }

    getAliases(repoPath: string): Map<string, string> {
        return this.aliasesByRepo.get(repoPath) || new Map();
    }

    setAliases(repoPath: string, aliases: Map<string, string>) {
        this.aliasesByRepo.set(repoPath, aliases);
    }

    clearAliases() {
        this.aliasesByRepo.clear();
    }

    isRepositoryExpanded(repoPath: string): boolean {
        return this.expandedRepos.has(repoPath);
    }

    toggleRepository(repoPath: string) {
        if (this.expandedRepos.has(repoPath)) {
            this.expandedRepos.delete(repoPath);
        } else {
            this.expandedRepos.add(repoPath);
        }
    }

    getExpandedRepos(): Set<string> {
        return this.expandedRepos;
    }

    getShowRemoteBranches(): boolean {
        return this.showRemoteBranches;
    }

    setShowRemoteBranches(value: boolean) {
        this.showRemoteBranches = value;
    }
} 