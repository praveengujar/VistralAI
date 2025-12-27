/**
 * Jest Setup File
 * Global test configuration and setup
 */

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.USE_FIRECRAWL = 'false';
process.env.USE_BULL_QUEUE = 'false';
process.env.USE_REAL_API = 'false';
process.env.CONFIDENCE_THRESHOLD = '0.85';
process.env.CLAUDE_MODEL = 'claude-sonnet-4-20250514';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.FIRECRAWL_INTERNAL_URL = 'http://localhost:3002';

// Suppress console output during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging
  error: console.error,
};

// Set test timeout for longer operations
jest.setTimeout(30000);
