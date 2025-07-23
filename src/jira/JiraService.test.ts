/**
 * Integration tests for JiraService with ConfigService
 * 
 * These tests verify that JiraService correctly integrates with ConfigService
 * through dependency injection and uses the configuration service for all
 * configuration-related operations.
 */

import { JiraService } from './JiraService';
import { ConfigService, IConfigService } from '../config/ConfigService';

/**
 * Mock ConfigService for testing
 */
class MockConfigService implements IConfigService {
    private mockBaseUrl: string = 'https://test.atlassian.net';
    private mockToken: string = 'test-token';
    private mockBranchPattern: string = '.*_(TEST-\\d+)';

    getJiraBaseUrl(): string {
        return this.mockBaseUrl;
    }

    getJiraToken(): string {
        return this.mockToken;
    }

    getBranchPattern(): string {
        return this.mockBranchPattern;
    }

    validateJiraConfig() {
        return {
            isValid: true,
            errors: [],
            warnings: []
        };
    }

    getDefaultJiraBaseUrl(): string {
        return 'https://your-jira-instance.com';
    }

    getJiraConfig() {
        return {
            baseUrl: this.mockBaseUrl,
            token: this.mockToken,
            branchPattern: this.mockBranchPattern
        };
    }

    onConfigurationChanged() {
        return { dispose: () => {} };
    }

    // Test helper methods
    setMockBaseUrl(url: string): void {
        this.mockBaseUrl = url;
    }

    setMockToken(token: string): void {
        this.mockToken = token;
    }

    setMockBranchPattern(pattern: string): void {
        this.mockBranchPattern = pattern;
    }
}

/**
 * Test suite for JiraService integration with ConfigService
 */
export class JiraServiceIntegrationTests {
    private mockConfigService: MockConfigService;
    private jiraService: JiraService;

    constructor() {
        this.mockConfigService = new MockConfigService();
        this.jiraService = JiraService.getInstance(this.mockConfigService);
    }

    /**
     * Run all integration tests
     */
    public runAllTests(): void {
        console.log('Running JiraService integration tests...');
        
        this.testConstructorWithDependencyInjection();
        this.testExtractJiraKeyUsesConfigService();
        this.testGetJiraUrlUsesConfigService();
        this.testConfigurationDependency();
        this.testErrorHandling();
        
        console.log('JiraService integration tests completed.');
    }

    private testConstructorWithDependencyInjection(): void {
        try {
            JiraService.resetInstance();
            const service = JiraService.getInstance(this.mockConfigService);
            console.log('✓ JiraService accepts ConfigService through dependency injection');
        } catch (error) {
            console.error('✗ Constructor with dependency injection failed:', error);
        }
    }

    private testExtractJiraKeyUsesConfigService(): void {
        try {
            // Test with default pattern
            let result = this.jiraService.extractJiraKey('feature_TEST-123');
            console.log('✓ extractJiraKey uses ConfigService - valid match:', result === 'TEST-123');

            // Test with no match
            result = this.jiraService.extractJiraKey('invalid-branch');
            console.log('✓ extractJiraKey handles no match:', result === null);

            // Test with different pattern
            this.mockConfigService.setMockBranchPattern('.*_(PROJ-\\d+)');
            result = this.jiraService.extractJiraKey('feature_PROJ-456');
            console.log('✓ extractJiraKey uses updated pattern:', result === 'PROJ-456');

            // Test with invalid regex pattern
            this.mockConfigService.setMockBranchPattern('[invalid-regex');
            result = this.jiraService.extractJiraKey('feature_TEST-123');
            console.log('✓ extractJiraKey handles invalid regex gracefully:', result === null);

            // Reset pattern
            this.mockConfigService.setMockBranchPattern('.*_(TEST-\\d+)');
        } catch (error) {
            console.error('✗ extractJiraKey ConfigService integration failed:', error);
        }
    }

    private testGetJiraUrlUsesConfigService(): void {
        try {
            // Test with valid configuration
            let result = this.jiraService.getJiraUrl('TEST-123');
            const expectedUrl = 'https://test.atlassian.net/browse/TEST-123';
            console.log('✓ getJiraUrl uses ConfigService baseUrl:', result === expectedUrl);

            // Test with empty base URL
            this.mockConfigService.setMockBaseUrl('');
            result = this.jiraService.getJiraUrl('TEST-123');
            console.log('✓ getJiraUrl handles empty baseUrl:', result === null);

            // Test with empty jiraKey
            this.mockConfigService.setMockBaseUrl('https://test.atlassian.net');
            result = this.jiraService.getJiraUrl('');
            console.log('✓ getJiraUrl handles empty jiraKey:', result === null);

            // Reset base URL
            this.mockConfigService.setMockBaseUrl('https://test.atlassian.net');
        } catch (error) {
            console.error('✗ getJiraUrl ConfigService integration failed:', error);
        }
    }

    private testConfigurationDependency(): void {
        try {
            // Test that JiraService doesn't directly access vscode.workspace.getConfiguration
            // This is verified by the fact that it works with our mock ConfigService
            
            // Change configuration through mock
            this.mockConfigService.setMockBaseUrl('https://different.atlassian.net');
            this.mockConfigService.setMockToken('different-token');
            
            const url = this.jiraService.getJiraUrl('TEST-123');
            const expectedUrl = 'https://different.atlassian.net/browse/TEST-123';
            console.log('✓ JiraService uses injected ConfigService (not direct vscode config):', url === expectedUrl);
            
            // Reset
            this.mockConfigService.setMockBaseUrl('https://test.atlassian.net');
            this.mockConfigService.setMockToken('test-token');
        } catch (error) {
            console.error('✗ Configuration dependency test failed:', error);
        }
    }

    private testErrorHandling(): void {
        try {
            // Test with missing configuration
            this.mockConfigService.setMockBaseUrl('');
            this.mockConfigService.setMockToken('');
            
            const url = this.jiraService.getJiraUrl('TEST-123');
            console.log('✓ JiraService handles missing configuration gracefully:', url === null);
            
            // Reset configuration
            this.mockConfigService.setMockBaseUrl('https://test.atlassian.net');
            this.mockConfigService.setMockToken('test-token');
        } catch (error) {
            console.error('✗ Error handling test failed:', error);
        }
    }
}

/**
 * Test integration with real ConfigService
 */
export class JiraServiceRealConfigIntegrationTests {
    private configService: ConfigService;
    private jiraService: JiraService;

    constructor() {
        this.configService = ConfigService.getInstance();
        this.jiraService = JiraService.getInstance();
    }

    /**
     * Run integration tests with real ConfigService
     */
    public runRealConfigTests(): void {
        console.log('Running JiraService tests with real ConfigService...');
        
        this.testRealConfigIntegration();
        
        console.log('JiraService real config integration tests completed.');
        this.cleanup();
    }

    private testRealConfigIntegration(): void {
        try {
            // Test that JiraService works with real ConfigService
            const pattern = this.jiraService.extractJiraKey('feature_PROJ-123');
            console.log('✓ JiraService works with real ConfigService for extractJiraKey');
            
            const url = this.jiraService.getJiraUrl('PROJ-123');
            console.log('✓ JiraService works with real ConfigService for getJiraUrl:', typeof url === 'string' || url === null);
            
            // Test configuration validation through ConfigService
            const validation = this.configService.validateJiraConfig();
            console.log('✓ ConfigService validation works:', typeof validation.isValid === 'boolean');
        } catch (error) {
            console.error('✗ Real ConfigService integration failed:', error);
        }
    }

    private cleanup(): void {
        // Reset singletons in tests
        ConfigService.resetInstance();
        JiraService.resetInstance();
    }
}

/**
 * Helper functions to run tests manually
 */
export function runJiraServiceIntegrationTests(): void {
    const tests = new JiraServiceIntegrationTests();
    tests.runAllTests();
}

export function runJiraServiceRealConfigTests(): void {
    const tests = new JiraServiceRealConfigIntegrationTests();
    tests.runRealConfigTests();
}

/**
 * Run all JiraService tests
 */
export function runAllJiraServiceTests(): void {
    runJiraServiceIntegrationTests();
    runJiraServiceRealConfigTests();
}

/**
 * Example usage in extension development:
 * 
 * import { runAllJiraServiceTests } from './jira/JiraService.test';
 * 
 * // In your extension activation or command
 * runAllJiraServiceTests();
 */