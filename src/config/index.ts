/**
 * Configuration module exports
 */

import { ConfigService } from './ConfigService';

export { ConfigService, IConfigService, ConfigValidationResult, JiraConfig } from './ConfigService';
export { runConfigServiceTests } from './ConfigService.test';

// Convenience export for getting singleton instance
export const getConfigService = () => ConfigService.getInstance();