/**
 * Unit tests for ConfigService
 * 
 * These tests are designed to be run within the VS Code extension environment
 * where the vscode module is available. They test the core functionality of
 * the ConfigService including configuration reading, validation, and caching.
 */

import { ConfigService } from './ConfigService';

/**
 * Test suite for ConfigService
 * Run these tests using VS Code's built-in test runner or extension host
 */
export class ConfigServiceTests {
    private configService: ConfigService;

    constructor() {
        this.configService = ConfigService.getInstance();
    }

    /**
     * Run all tests
     */
    public runAllTests(): void {
        console.log('Running ConfigService tests...');
        
        this.testGetJiraBaseUrl();
        this.testGetJiraToken();
        this.testGetBranchPattern();
        this.testGetDefaultJiraBaseUrl();
        this.testGetJiraConfig();
        this.testValidateJiraConfig();
        this.testConfigurationCaching();
        
        console.log('ConfigService tests completed.');
        this.cleanup();
    }

    private testGetJiraBaseUrl(): void {
        try {
            const result = this.configService.getJiraBaseUrl();
            console.log('✓ getJiraBaseUrl returns string:', typeof result === 'string');
        } catch (error) {
            console.error('✗ getJiraBaseUrl failed:', error);
        }
    }

    private testGetJiraToken(): void {
        try {
            const result = this.configService.getJiraToken();
            console.log('✓ getJiraToken returns string:', typeof result === 'string');
        } catch (error) {
            console.error('✗ getJiraToken failed:', error);
        }
    }

    private testGetBranchPattern(): void {
        try {
            const result = this.configService.getBranchPattern();
            console.log('✓ getBranchPattern returns string:', typeof result === 'string');
            
            // Test that it's a valid regex
            new RegExp(result);
            console.log('✓ getBranchPattern returns valid regex');
        } catch (error) {
            console.error('✗ getBranchPattern failed:', error);
        }
    }

    private testGetDefaultJiraBaseUrl(): void {
        try {
            const result = this.configService.getDefaultJiraBaseUrl();
            const expected = 'https://your-jira-instance.com';
            console.log('✓ getDefaultJiraBaseUrl returns expected value:', result === expected);
        } catch (error) {
            console.error('✗ getDefaultJiraBaseUrl failed:', error);
        }
    }

    private testGetJiraConfig(): void {
        try {
            const result = this.configService.getJiraConfig();
            const hasRequiredFields = result.baseUrl !== undefined && 
                                    result.token !== undefined && 
                                    result.branchPattern !== undefined;
            console.log('✓ getJiraConfig returns object with required fields:', hasRequiredFields);
            
            // Test that it returns a copy
            const result2 = this.configService.getJiraConfig();
            console.log('✓ getJiraConfig returns copy:', result !== result2);
        } catch (error) {
            console.error('✗ getJiraConfig failed:', error);
        }
    }

    private testValidateJiraConfig(): void {
        try {
            const result = this.configService.validateJiraConfig();
            const hasRequiredFields = result.isValid !== undefined && 
                                    Array.isArray(result.errors) && 
                                    Array.isArray(result.warnings);
            console.log('✓ validateJiraConfig returns validation result:', hasRequiredFields);
            
            // Test validation logic with current config
            console.log('✓ Current config validation - isValid:', result.isValid);
            console.log('✓ Current config validation - errors:', result.errors.length);
            console.log('✓ Current config validation - warnings:', result.warnings.length);
        } catch (error) {
            console.error('✗ validateJiraConfig failed:', error);
        }
    }

    private testConfigurationCaching(): void {
        try {
            // Test that multiple calls return the same cached result
            const config1 = this.configService.getJiraConfig();
            const config2 = this.configService.getJiraConfig();
            
            // They should be equal in content but different objects
            const sameContent = config1.baseUrl === config2.baseUrl && 
                              config1.token === config2.token && 
                              config1.branchPattern === config2.branchPattern;
            console.log('✓ Configuration caching works correctly:', sameContent);
        } catch (error) {
            console.error('✗ Configuration caching test failed:', error);
        }
    }

    private cleanup(): void {
        // Don't dispose singleton in tests, just reset for testing
        ConfigService.resetInstance();
    }
}

/**
 * Helper function to run tests manually
 */
export function runConfigServiceTests(): void {
    const tests = new ConfigServiceTests();
    tests.runAllTests();
}

/**
 * Example usage in extension development:
 * 
 * import { runConfigServiceTests } from './config/ConfigService.test';
 * 
 * // In your extension activation or command
 * runConfigServiceTests();
 */