import * as vscode from 'vscode';
import { Repository } from '../git';
import { IJiraService } from '../jira';
import { BranchAliasState } from '../state/BranchAliasState';
import { GitRepositoryManager } from '../git/GitRepositoryManager';

/**
 * Interface for the Sync Service
 * Responsible for handling all JIRA synchronization logic
 */
export interface ISyncService {
    /**
     * Event that fires when a sync operation completes
     */
    readonly onDidSync: vscode.Event<SyncResult>;
    
    /**
     * Checks for branches without aliases and syncs them with JIRA
     */
    checkAndSyncMissingAliases(): Promise<void>;
    
    /**
     * Syncs all branches with JIRA information
     */
    syncWithJira(): Promise<void>;
    
    /**
     * Syncs a specific repository with JIRA
     * @param repository The repository to sync
     * @returns Map of branch names to their aliases
     */
    syncRepository(repository: Repository): Promise<Map<string, string>>;
}

/**
 * Result of a sync operation
 */
export interface SyncResult {
    success: boolean;
    syncedCount: number;
    errors: string[];
    newAliases: Map<string, string>;
}

/**
 * Service responsible for synchronizing Git branches with JIRA information
 */
export class SyncService implements ISyncService {
    private _onDidSync: vscode.EventEmitter<SyncResult> = new vscode.EventEmitter<SyncResult>();
    readonly onDidSync: vscode.Event<SyncResult> = this._onDidSync.event;

    /**
     * Creates a new instance of SyncService
     * @param jiraService The JIRA service for fetching issue information
     * @param gitManager The Git repository manager
     * @param state The branch alias state manager
     */
    constructor(
        private readonly jiraService: IJiraService,
        private readonly gitManager: GitRepositoryManager,
        private readonly state: BranchAliasState
    ) {}

    /**
     * Normalizes a branch name by removing the remote prefix
     * @param branchName The branch name to normalize
     * @returns The normalized branch name
     */
    private getBranchKey(branchName: string): string {
        return branchName.replace(/^origin\//, '');
    }

    /**
     * Checks for branches without aliases and syncs them with JIRA
     */
    public async checkAndSyncMissingAliases(): Promise<void> {
        try {
            const jiraKeysToFetch = new Set<string>();
            let hasNewAliases = false;

            // Check all repositories' branches
            for (const repo of this.gitManager.getRepositories()) {
                const repoPath = repo.rootUri.fsPath;
                const branches = await this.gitManager.getActiveBranches(repo, false); // Only check local branches
                const existingAliases = this.state.getAliases(repoPath);

                // Find branches with JIRA keys but no aliases
                for (const branch of branches) {
                    const normalizedBranchName = this.getBranchKey(branch.name);
                    const jiraKey = this.jiraService.extractJiraKey(normalizedBranchName);

                    if (jiraKey && !existingAliases.has(normalizedBranchName)) {
                        jiraKeysToFetch.add(jiraKey);
                    }
                }
            }

            // If there are JIRA keys to fetch
            if (jiraKeysToFetch.size > 0) {
                console.log(`${vscode.l10n.t('Detected {0} new branches that need to sync JIRA information', jiraKeysToFetch.size)}: ${Array.from(jiraKeysToFetch).join(', ')}`);

                const summaries = await this.jiraService.getBatchIssueSummaries(Array.from(jiraKeysToFetch));
                const newAliases = new Map<string, string>();

                // Update aliases for each repository
                for (const repo of this.gitManager.getRepositories()) {
                    const repoPath = repo.rootUri.fsPath;
                    const branches = await this.gitManager.getActiveBranches(repo, false);
                    const existingAliases = this.state.getAliases(repoPath);

                    for (const branch of branches) {
                        const normalizedBranchName = this.getBranchKey(branch.name);
                        const jiraKey = this.jiraService.extractJiraKey(normalizedBranchName);

                        if (jiraKey && summaries[jiraKey] && !existingAliases.has(normalizedBranchName)) {
                            const alias = `${jiraKey}: ${summaries[jiraKey]}`;
                            existingAliases.set(normalizedBranchName, alias);
                            newAliases.set(normalizedBranchName, alias);
                            hasNewAliases = true;
                            console.log(`${vscode.l10n.t('Added new alias')}: ${normalizedBranchName} -> ${alias}`);
                        }
                    }

                    this.state.setAliases(repoPath, existingAliases);
                }

                if (hasNewAliases) {
                    await this.state.saveCache();
                    
                    const result: SyncResult = {
                        success: true,
                        syncedCount: jiraKeysToFetch.size,
                        errors: [],
                        newAliases
                    };
                    
                    this._onDidSync.fire(result);

                    vscode.window.showInformationMessage(
                        vscode.l10n.t('Synced JIRA information for {0} new branches', jiraKeysToFetch.size)
                    );
                }
            }
        } catch (error) {
            console.error(vscode.l10n.t('Error occurred while checking and syncing missing aliases'), error);
            
            const result: SyncResult = {
                success: false,
                syncedCount: 0,
                errors: [error instanceof Error ? error.message : String(error)],
                newAliases: new Map()
            };
            
            this._onDidSync.fire(result);
        }
    }

    /**
     * Syncs all branches with JIRA information
     */
    public async syncWithJira(): Promise<void> {
        try {
            const jiraKeys = new Set<string>();
            const allRepositories = this.gitManager.getRepositories();
            
            // Collect all JIRA keys from branches
            for (const repo of allRepositories) {
                const branches = await this.gitManager.getActiveBranches(repo, true);
                for (const branch of branches) {
                    const normalizedBranchName = this.getBranchKey(branch.name);
                    const jiraKey = this.jiraService.extractJiraKey(normalizedBranchName);
                    if (jiraKey) {
                        jiraKeys.add(jiraKey);
                    }
                }
            }

            // Fetch summaries for all JIRA keys
            const summaries = await this.jiraService.getBatchIssueSummaries(Array.from(jiraKeys));
            const newAliases = new Map<string, string>();
            
            // Update aliases for each repository
            for (const repo of allRepositories) {
                const repoAliases = await this.syncRepositoryWithSummaries(repo, summaries);
                
                // Merge the new aliases
                for (const [branch, alias] of repoAliases.entries()) {
                    newAliases.set(branch, alias);
                }
            }

            await this.state.saveCache();
            
            const result: SyncResult = {
                success: true,
                syncedCount: jiraKeys.size,
                errors: [],
                newAliases
            };
            
            this._onDidSync.fire(result);
        } catch (error) {
            console.error(vscode.l10n.t('Error occurred while syncing with JIRA'), error);
            
            const result: SyncResult = {
                success: false,
                syncedCount: 0,
                errors: [error instanceof Error ? error.message : String(error)],
                newAliases: new Map()
            };
            
            this._onDidSync.fire(result);
        }
    }

    /**
     * Syncs a specific repository with JIRA
     * @param repository The repository to sync
     * @returns Map of branch names to their aliases
     */
    public async syncRepository(repository: Repository): Promise<Map<string, string>> {
        try {
            const jiraKeys = new Set<string>();
            const branches = await this.gitManager.getActiveBranches(repository, this.state.getShowRemoteBranches());
            
            // Collect JIRA keys from branches
            for (const branch of branches) {
                const normalizedBranchName = this.getBranchKey(branch.name);
                const jiraKey = this.jiraService.extractJiraKey(normalizedBranchName);
                if (jiraKey) {
                    jiraKeys.add(jiraKey);
                }
            }
            
            // Fetch summaries for JIRA keys
            const summaries = await this.jiraService.getBatchIssueSummaries(Array.from(jiraKeys));
            
            // Update aliases for the repository
            return await this.syncRepositoryWithSummaries(repository, summaries);
        } catch (error) {
            console.error(vscode.l10n.t('Error occurred while syncing repository'), error);
            return new Map<string, string>();
        }
    }

    /**
     * Helper method to sync a repository with pre-fetched JIRA summaries
     * @param repository The repository to sync
     * @param summaries The JIRA issue summaries
     * @returns Map of branch names to their aliases
     */
    private async syncRepositoryWithSummaries(
        repository: Repository, 
        summaries: Record<string, string>
    ): Promise<Map<string, string>> {
        const repoPath = repository.rootUri.fsPath;
        const branches = await this.gitManager.getActiveBranches(repository, this.state.getShowRemoteBranches());
        const aliases = new Map<string, string>();

        for (const branch of branches) {
            const normalizedBranchName = this.getBranchKey(branch.name);
            const jiraKey = this.jiraService.extractJiraKey(normalizedBranchName);
            if (jiraKey && summaries[jiraKey]) {
                aliases.set(normalizedBranchName, `${jiraKey}: ${summaries[jiraKey]}`);
            }
        }

        this.state.setAliases(repoPath, aliases);
        return aliases;
    }
}