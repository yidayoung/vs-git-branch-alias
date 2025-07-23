import * as vscode from 'vscode';
import axios from 'axios';
import { ConfigService, IConfigService } from '../config/ConfigService';

/**
 * JiraService interface for better testability
 */
export interface IJiraService {
    extractJiraKey(branchName: string): string | null;
    getIssueTitle(jiraKey: string): Promise<string | null>;
    getBatchIssueSummaries(jiraKeys: string[]): Promise<Record<string, string>>;
    getJiraUrl(jiraKey: string): string | null;
}

export class JiraService implements IJiraService {
    private static instance: JiraService | null = null;
    private readonly configService: IConfigService;

    private constructor(configService?: IConfigService) {
        this.configService = configService || ConfigService.getInstance();
    }

    /**
     * Get singleton instance of JiraService
     */
    public static getInstance(configService?: IConfigService): JiraService {
        if (!JiraService.instance) {
            JiraService.instance = new JiraService(configService);
        }
        return JiraService.instance;
    }

    /**
     * Reset singleton instance (mainly for testing)
     */
    public static resetInstance(): void {
        JiraService.instance = null;
    }

    public extractJiraKey(branchName: string): string | null {
        try {
            const pattern = this.configService.getBranchPattern();
            const regex = new RegExp(pattern);
            const match = branchName.match(regex);
            return match ? match[1] : null;
        } catch (error) {
            return null;
        }
    }

    public async getIssueTitle(jiraKey: string): Promise<string | null> {
        try {
            const baseUrl = this.configService.getJiraBaseUrl();
            const token = this.configService.getJiraToken();

            if (!baseUrl || !token) {
                return null;
            }

            const response = await axios.get(`${baseUrl}/rest/api/2/issue/${jiraKey}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200 && response.data) {
                return response.data.fields.summary;
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                vscode.window.showErrorMessage(vscode.l10n.t('Jira authentication failed, please check if the configured token is correct'));
            }
        }

        return null;
    }

    async getBatchIssueSummaries(jiraKeys: string[]): Promise<Record<string, string>> {
        if (!jiraKeys.length) {
            return {};
        }

        const baseUrl = this.configService.getJiraBaseUrl();
        const token = this.configService.getJiraToken();

        if (!baseUrl || !token) {
            return {};
        }

        try {
            const jql = `issuekey in (${jiraKeys.join(',')})`;
            const response = await axios.get(`${baseUrl}/rest/api/2/search`, {
                params: {
                    jql,
                    fields: ['summary'],
                    maxResults: jiraKeys.length
                },
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200 && response.data?.issues) {
                return response.data.issues.reduce((acc: Record<string, string>, issue: any) => {
                    acc[issue.key] = issue.fields.summary;
                    return acc;
                }, {});
            }
        } catch (error) {
            // 静默处理错误
        }

        return {};
    }

    public getJiraUrl(jiraKey: string): string | null {
        const baseUrl = this.configService.getJiraBaseUrl();
        if (!baseUrl || !jiraKey) {
            return null;
        }
        return `${baseUrl}/browse/${jiraKey}`;
    }
} 