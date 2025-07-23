import * as vscode from 'vscode';
import { StatusBarManager } from './StatusBarManager';
import { BranchAliasState } from '../state/BranchAliasState';
import { GitRepositoryManager } from '../git/GitRepositoryManager';
import { ConfigService, IConfigService } from '../config/ConfigService';
import { JiraService } from '../jira/JiraService';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock vscode namespace
vi.mock('vscode', () => {
    const mockStatusBarItem = {
        text: '',
        tooltip: '',
        command: undefined,
        show: vi.fn(),
        dispose: vi.fn()
    };
    
    return {
        window: {
            createStatusBarItem: vi.fn(() => mockStatusBarItem),
            showInformationMessage: vi.fn(),
            showErrorMessage: vi.fn()
        },
        StatusBarAlignment: {
            Left: 1
        },
        workspace: {
            onDidChangeConfiguration: vi.fn(() => ({ dispose: vi.fn() }))
        },
        env: {
            openExternal: vi.fn()
        },
        Uri: {
            parse: vi.fn(url => url)
        },
        l10n: {
            t: (text: string, ...args: any[]) => {
                if (args.length) {
                    return `${text} ${args.join(' ')}`;
                }
                return text;
            }
        },
        EventEmitter: class {
            event = vi.fn(() => ({ dispose: vi.fn() }));
            fire = vi.fn();
            dispose = vi.fn();
        },
        Disposable: {
            from: vi.fn()
        },
        // Export the mock status bar item for assertions
        _mockStatusBarItem: mockStatusBarItem
    };
});

// Mock BranchAliasState
vi.mock('../state/BranchAliasState', () => {
    return {
        BranchAliasState: class {
            getAliases = vi.fn(() => new Map());
            getShowRemoteBranches = vi.fn(() => false);
        }
    };
});

// Mock GitRepositoryManager
vi.mock('../git/GitRepositoryManager', () => {
    return {
        GitRepositoryManager: class {
            getRepositories = vi.fn(() => []);
        }
    };
});

// Mock JiraService
vi.mock('../jira/JiraService', () => {
    return {
        JiraService: {
            getInstance: vi.fn(() => ({
                extractJiraKey: vi.fn(),
                getJiraUrl: vi.fn(),
                getBatchIssueSummaries: vi.fn()
            }))
        }
    };
});

// Mock ConfigService
vi.mock('../config/ConfigService', () => {
    const mockEventEmitter = {
        event: vi.fn(() => ({ dispose: vi.fn() })),
        fire: vi.fn()
    };
    
    return {
        ConfigService: {
            getInstance: vi.fn(() => ({
                getJiraBaseUrl: vi.fn(() => 'https://jira.example.com'),
                getJiraToken: vi.fn(() => 'token123'),
                getBranchPattern: vi.fn(() => '.*_(PROJ-\\d+)'),
                validateJiraConfig: vi.fn(() => ({ isValid: true, errors: [], warnings: [] })),
                getDefaultJiraBaseUrl: vi.fn(() => 'https://default-jira.example.com'),
                getJiraConfig: vi.fn(() => ({ baseUrl: 'https://jira.example.com', token: 'token123', branchPattern: '.*_(PROJ-\\d+)' })),
                onConfigurationChanged: vi.fn(() => ({ dispose: vi.fn() })),
                dispose: vi.fn()
            }))
        }
    };
});

describe('StatusBarManager', () => {
    let statusBarManager: StatusBarManager;
    let state: BranchAliasState;
    let gitManager: GitRepositoryManager;
    let configService: IConfigService;

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();
        
        // Create instances
        state = new BranchAliasState({} as any);
        gitManager = new GitRepositoryManager();
        configService = ConfigService.getInstance();
        
        // Create StatusBarManager instance
        statusBarManager = new StatusBarManager(state, gitManager, configService);
    });

    it('should create status bar item on initialization', () => {
        expect(vscode.window.createStatusBarItem).toHaveBeenCalledWith(vscode.StatusBarAlignment.Left);
    });

    it('should use JiraService with ConfigService', () => {
        expect(JiraService.getInstance).toHaveBeenCalledWith(configService);
    });

    it('should set up event listeners for configuration changes', () => {
        expect(vscode.workspace.onDidChangeConfiguration).toHaveBeenCalled();
        expect(configService.onConfigurationChanged).toHaveBeenCalled();
    });

    it('should update status bar with no repositories', async () => {
        vi.mocked(gitManager.getRepositories).mockReturnValue([]);
        
        await statusBarManager.updateStatusBar();
        
        // Access the mock status bar item directly
        expect((vscode as any)._mockStatusBarItem.text).toContain('No Repository');
        expect((vscode as any)._mockStatusBarItem.show).toHaveBeenCalled();
    });

    it('should validate JIRA configuration before opening links', async () => {
        // Mock repositories to have at least one
        vi.mocked(gitManager.getRepositories).mockReturnValue([{
            rootUri: { fsPath: '/test/repo', path: '/test/repo' },
            state: { HEAD: { name: 'feature_PROJ-123' } }
        } as any]);
        
        // Mock invalid JIRA config
        vi.mocked(configService.validateJiraConfig).mockReturnValue({
            isValid: false,
            errors: ['Invalid JIRA URL'],
            warnings: []
        });
        
        await statusBarManager.handleStatusBarClick();
        
        expect(vscode.window.showErrorMessage).toHaveBeenCalled();
        expect(vscode.env.openExternal).not.toHaveBeenCalled();
    });
});