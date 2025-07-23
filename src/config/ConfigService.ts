import * as vscode from 'vscode';

/**
 * Configuration validation result interface
 */
export interface ConfigValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * JIRA configuration interface
 */
export interface JiraConfig {
    baseUrl: string;
    token: string;
    branchPattern: string;
}

/**
 * Configuration service interface
 */
export interface IConfigService {
    getJiraBaseUrl(): string;
    getJiraToken(): string;
    getBranchPattern(): string;
    validateJiraConfig(): ConfigValidationResult;
    getDefaultJiraBaseUrl(): string;
    getJiraConfig(): JiraConfig;
    onConfigurationChanged(listener: () => void): vscode.Disposable;
}

/**
 * Unified configuration service for managing all configuration-related operations
 */
export class ConfigService implements IConfigService, vscode.Disposable {
    private static readonly CONFIG_SECTION = 'branchAlias';
    private static readonly DEFAULT_JIRA_BASE_URL = 'https://your-jira-instance.com';
    private static readonly DEFAULT_BRANCH_PATTERN = '.*_(PROJ-\\d+)';
    
    private static instance: ConfigService | null = null;
    
    private configCache: JiraConfig | null = null;
    private readonly configChangeEmitter = new vscode.EventEmitter<void>();
    private disposables: vscode.Disposable[] = [];

    constructor() {
        this.initialize();
    }

    /**
     * Get singleton instance of ConfigService
     */
    public static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }

    /**
     * Reset singleton instance (mainly for testing)
     */
    public static resetInstance(): void {
        if (ConfigService.instance) {
            ConfigService.instance.dispose();
            ConfigService.instance = null;
        }
    }

    private initialize(): void {
        // Listen for configuration changes
        const configChangeListener = vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration(ConfigService.CONFIG_SECTION)) {
                this.invalidateCache();
                this.configChangeEmitter.fire();
            }
        });
        
        this.disposables.push(configChangeListener);
        this.disposables.push(this.configChangeEmitter);
    }

    /**
     * Get the current workspace configuration
     */
    private getWorkspaceConfig(): vscode.WorkspaceConfiguration {
        return vscode.workspace.getConfiguration(ConfigService.CONFIG_SECTION);
    }

    /**
     * Invalidate the configuration cache
     */
    private invalidateCache(): void {
        this.configCache = null;
    }

    /**
     * Get cached or fresh configuration
     */
    private getConfig(): JiraConfig {
        if (!this.configCache) {
            const config = this.getWorkspaceConfig();
            this.configCache = {
                baseUrl: config.get<string>('jiraBaseUrl', ConfigService.DEFAULT_JIRA_BASE_URL),
                token: config.get<string>('jiraToken', ''),
                branchPattern: config.get<string>('branchPattern', ConfigService.DEFAULT_BRANCH_PATTERN)
            };
        }
        return this.configCache;
    }

    /**
     * Get JIRA base URL
     */
    public getJiraBaseUrl(): string {
        return this.getConfig().baseUrl;
    }

    /**
     * Get JIRA token
     */
    public getJiraToken(): string {
        return this.getConfig().token;
    }

    /**
     * Get branch pattern for extracting JIRA keys
     */
    public getBranchPattern(): string {
        return this.getConfig().branchPattern;
    }

    /**
     * Get default JIRA base URL
     */
    public getDefaultJiraBaseUrl(): string {
        return ConfigService.DEFAULT_JIRA_BASE_URL;
    }

    /**
     * Get complete JIRA configuration
     */
    public getJiraConfig(): JiraConfig {
        return { ...this.getConfig() };
    }

    /**
     * Validate JIRA configuration
     */
    public validateJiraConfig(): ConfigValidationResult {
        const config = this.getConfig();
        const errors: string[] = [];
        const warnings: string[] = [];

        // Validate base URL
        if (!config.baseUrl || config.baseUrl.trim() === '') {
            errors.push('JIRA base URL is required');
        } else if (config.baseUrl === ConfigService.DEFAULT_JIRA_BASE_URL) {
            warnings.push('JIRA base URL is set to default value, please configure your actual JIRA instance URL');
        } else {
            try {
                new URL(config.baseUrl);
            } catch {
                errors.push('JIRA base URL is not a valid URL');
            }
        }

        // Validate token
        if (!config.token || config.token.trim() === '') {
            warnings.push('JIRA token is not configured, JIRA integration will not work');
        }

        // Validate branch pattern
        if (!config.branchPattern || config.branchPattern.trim() === '') {
            errors.push('Branch pattern is required');
        } else {
            try {
                new RegExp(config.branchPattern);
            } catch {
                errors.push('Branch pattern is not a valid regular expression');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Register a listener for configuration changes
     */
    public onConfigurationChanged(listener: () => void): vscode.Disposable {
        return this.configChangeEmitter.event(listener);
    }

    /**
     * Dispose of the service and clean up resources
     */
    public dispose(): void {
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
        this.configCache = null;
        
        // Reset singleton instance when disposing
        if (ConfigService.instance === this) {
            ConfigService.instance = null;
        }
    }
}