import * as vscode from 'vscode';
import axios from 'axios';

export class JiraService {
    private readonly config: vscode.WorkspaceConfiguration;

    constructor() {
        this.config = vscode.workspace.getConfiguration('branchAlias');
    }

    public extractJiraKey(branchName: string): string | null {
        try {
            const pattern = this.config.get<string>('branchPattern', '.*_(PROJ-\\d+)');
            const regex = new RegExp(pattern);
            const match = branchName.match(regex);
            return match ? match[1] : null;
        } catch (error) {
            return null;
        }
    }

    public async getIssueTitle(jiraKey: string): Promise<string | null> {
        try {
            const baseUrl = this.config.get<string>('jiraBaseUrl');
            const token = this.config.get<string>('jiraToken');

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

        const baseUrl = this.config.get<string>('jiraBaseUrl');
        const token = this.config.get<string>('jiraToken');

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
        const baseUrl = this.config.get<string>('jiraBaseUrl');
        if (!baseUrl || !jiraKey) {
            return null;
        }
        return `${baseUrl}/browse/${jiraKey}`;
    }
} 