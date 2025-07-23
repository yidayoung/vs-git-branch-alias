/**
 * Simple test runner for manual testing during development
 */

import { runConfigServiceTests } from './config/ConfigService.test';
import { runAllJiraServiceTests } from './jira/JiraService.test';

/**
 * Run all tests
 */
export function runAllTests(): void {
    console.log('=== Running All Tests ===');
    
    try {
        runConfigServiceTests();
        console.log('');
        runAllJiraServiceTests();
        console.log('=== All Tests Completed ===');
    } catch (error) {
        console.error('=== Test Execution Failed ===', error);
    }
}

/**
 * Export for use in extension development
 */
export { runConfigServiceTests, runAllJiraServiceTests };