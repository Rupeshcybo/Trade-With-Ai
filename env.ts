/**
 * Environment Configuration Validator
 * Ensures all required environment variables are present before app starts
 */

interface EnvConfig {
  VITE_GEMINI_API_KEY: string;
  VITE_APP_NAME?: string;
  VITE_API_URL?: string;
  MODE: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate required environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required variables
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    errors.push('VITE_GEMINI_API_KEY is not defined');
  } else if (apiKey === 'PLACEHOLDER_API_KEY') {
    errors.push('VITE_GEMINI_API_KEY is still set to placeholder value');
  } else if (apiKey.length < 20) {
    warnings.push('VITE_GEMINI_API_KEY seems too short, please verify');
  }

  // Optional but recommended variables
  if (!import.meta.env.VITE_APP_NAME) {
    warnings.push('VITE_APP_NAME is not set (optional)');
  }

  // Environment mode check
  const mode = import.meta.env.MODE;
  if (mode === 'production') {
    console.log('🚀 Running in PRODUCTION mode');
    
    // Production-specific checks
    if (import.meta.env.DEV) {
      warnings.push('DEV flag is true in production mode');
    }
  } else {
    console.log('🔧 Running in DEVELOPMENT mode');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get typed environment configuration
 */
export function getEnvConfig(): EnvConfig {
  return {
    VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || '',
    VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    MODE: import.meta.env.MODE,
  };
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return import.meta.env.PROD === true || import.meta.env.MODE === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV === true || import.meta.env.MODE === 'development';
}

/**
 * Display environment validation results
 */
export function displayValidationResults(result: ValidationResult): void {
  console.group('🔍 Environment Validation');
  
  if (result.isValid) {
    console.log('✅ All required environment variables are configured');
  } else {
    console.error('❌ Environment validation failed');
    result.errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (result.warnings.length > 0) {
    console.warn('⚠️ Warnings:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  console.groupEnd();
}

/**
 * Initialize environment validation on app start
 * Call this in main.tsx before rendering
 */
export function initializeEnvironment(): boolean {
  const validation = validateEnvironment();
  displayValidationResults(validation);
  
  if (!validation.isValid && isProduction()) {
    // In production, we might want to show an error screen
    console.error('Cannot start application with invalid environment configuration');
    return false;
  }
  
  return true;
}

// Export singleton config
export const config = getEnvConfig();
