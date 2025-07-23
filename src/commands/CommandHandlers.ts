import * as vscode from 'vscode';
import { IConfigService } from '../config/ConfigService';
import { BranchAliasManager } from '../branchAliasManager';
import { BranchAliasProvider, RepositoryItem } from '../branchAliasProvider';
import { ISyncService } from '../sync';

/**
 * Command handlers interface
 */
export interface ICommandHandlers {
    handleOpenJiraTokenPage(): Promise<void>;
    handleRefresh(): Promise<void>;
    handleToggleRemoteBranches(): Promise<void>;
    handleToggleRepository(item: RepositoryItem): Promise<void>;
    handleOpenJiraLinks(): Promise<void>;
    handleSyncWithJira(): Promise<void>;
}

/**
 * Service for handling all VS Code command implementations
 */
export class CommandHandlers implements ICommandHandlers {
    constructor(
        private readonly configService: IConfigService,
        private readonly branchAliasManager: BranchAliasManager,
        private readonly branchAliasProvider: BranchAliasProvider,
        private readonly syncService: ISyncService
    ) { }

    /**
     * Handle opening JIRA token generation page
     */
    public async handleOpenJiraTokenPage(): Promise<void> {
        const jiraBaseUrl = this.configService.getJiraBaseUrl();

        // Check if valid JIRA URL is configured
        if (jiraBaseUrl === this.configService.getDefaultJiraBaseUrl()) {
            const result = await vscode.window.showWarningMessage(
                vscode.l10n.t('Please configure JIRA base URL before generating a token'),
                vscode.l10n.t('Open Settings')
            );
            if (result === vscode.l10n.t('Open Settings')) {
                await vscode.commands.executeCommand('workbench.action.openSettings', 'branchAlias.jiraBaseUrl');
            }
            return;
        }

        // Construct JIRA API Token generation page URL
        const tokenUrl = `${jiraBaseUrl.replace(/\/$/, '')}/secure/ViewProfile.jspa?selectedTab=com.atlassian.pats.pats-plugin:jira-user-personal-access-tokens`;

        try {
            // Show progress indicator
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: vscode.l10n.t('Opening JIRA token generation page...'),
                cancellable: false
            }, async () => {
                await vscode.env.openExternal(vscode.Uri.parse(tokenUrl));
                // Brief delay to show progress
                await new Promise(resolve => setTimeout(resolve, 1000));
            });

            // Show success message and next steps
            const result = await vscode.window.showInformationMessage(
                vscode.l10n.t('JIRA token generation page opened in browser. After generating a token, please copy and paste it into the settings.'),
                vscode.l10n.t('Open Token Settings')
            );

            if (result === vscode.l10n.t('Open Token Settings')) {
                await vscode.commands.executeCommand('workbench.action.openSettings', 'branchAlias.jiraToken');
            }

        } catch (error) {
            vscode.window.showErrorMessage(vscode.l10n.t('Could not open JIRA token generation page: {0}', error instanceof Error ? error.message : String(error)));
        }
    }

    /**
     * Handle refresh command
     * Refreshes the branch alias provider view
     */
    public async handleRefresh(): Promise<void> {
        try {
            this.branchAliasProvider.forceRefresh();
        } catch (error) {
            vscode.window.showErrorMessage(vscode.l10n.t('Failed to refresh branch aliases: {0}', error instanceof Error ? error.message : String(error)));
        }
    }

    /**
     * Handle toggle remote branches command
     * Toggles the visibility of remote branches in the view
     */
    public async handleToggleRemoteBranches(): Promise<void> {
        try {
            await this.branchAliasManager.toggleRemoteBranches();
            this.branchAliasProvider.refresh();
            
            // Show feedback to user about the current state
            const showRemotes = this.branchAliasManager.state?.getShowRemoteBranches();
            vscode.window.showInformationMessage(
                showRemotes 
                    ? vscode.l10n.t('Remote branches are now visible') 
                    : vscode.l10n.t('Remote branches are now hidden')
            );
        } catch (error) {
            vscode.window.showErrorMessage(vscode.l10n.t('Failed to toggle remote branches: {0}', error instanceof Error ? error.message : String(error)));
        }
    }

    /**
     * Handle toggle repository command
     * Expands or collapses a repository in the tree view
     * @param item The repository item to toggle
     */
    public async handleToggleRepository(item: RepositoryItem): Promise<void> {
        try {
            await this.branchAliasManager.toggleRepository(item.repository.rootUri.fsPath);
            this.branchAliasProvider.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(vscode.l10n.t('Failed to toggle repository: {0}', error instanceof Error ? error.message : String(error)));
        }
    }

    /**
     * Handle open JIRA links command
     * Opens JIRA issues related to the current branch in the browser
     */
    public async handleOpenJiraLinks(): Promise<void> {
        try {
            // Validate JIRA configuration before proceeding
            const configValidation = this.configService.validateJiraConfig();
            if (!configValidation.isValid) {
                vscode.window.showErrorMessage(vscode.l10n.t('JIRA configuration is invalid: {0}', configValidation.errors.join(', ')));
                
                // Offer to open settings
                const result = await vscode.window.showWarningMessage(
                    vscode.l10n.t('Would you like to configure JIRA settings?'),
                    vscode.l10n.t('Open Settings')
                );
                
                if (result === vscode.l10n.t('Open Settings')) {
                    await vscode.commands.executeCommand('workbench.action.openSettings', 'branchAlias.jiraBaseUrl');
                }
                return;
            }
            
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: vscode.l10n.t('Opening JIRA links...'),
                cancellable: false
            }, async () => {
                await this.branchAliasManager.handleStatusBarClick();
                // Brief delay to show progress
                await new Promise(resolve => setTimeout(resolve, 500));
            });
        } catch (error) {
            vscode.window.showErrorMessage(vscode.l10n.t('Failed to open JIRA links: {0}', error instanceof Error ? error.message : String(error)));
        }
    }

    /**
     * Handle sync with JIRA command
     * Synchronizes branch information with JIRA
     */
    public async handleSyncWithJira(): Promise<void> {
        try {
            // Validate JIRA configuration before proceeding
            const configValidation = this.configService.validateJiraConfig();
            if (!configValidation.isValid) {
                vscode.window.showErrorMessage(vscode.l10n.t('JIRA configuration is invalid: {0}', configValidation.errors.join(', ')));
                
                // Offer to open settings
                const result = await vscode.window.showWarningMessage(
                    vscode.l10n.t('Would you like to configure JIRA settings?'),
                    vscode.l10n.t('Open Settings')
                );
                
                if (result === vscode.l10n.t('Open Settings')) {
                    await vscode.commands.executeCommand('workbench.action.openSettings', 'branchAlias.jiraBaseUrl');
                }
                return;
            }
            
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: vscode.l10n.t('Synchronizing with JIRA...'),
                cancellable: false
            }, async () => {
                await this.syncService.syncWithJira();
            });
            
            // Refresh the view after sync
            this.branchAliasProvider.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(vscode.l10n.t('Failed to sync with JIRA: {0}', error instanceof Error ? error.message : String(error)));
        }
    }
}