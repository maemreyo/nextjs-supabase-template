/**
 * Rate Limiting Utility (Legacy - DEPRECATED)
 * 
 * ⚠️  DEPRECATED: This file has been split for better architecture:
 * - Use rate-limiter-server.ts for API routes and server components
 * - Use rate-limiter-client.ts for React components (requires "use client")
 * 
 * This file now only re-exports server-safe utilities for backward compatibility
 */

// Re-export server-safe utilities
export {
  rateLimiting,
  createRateLimiter,
  rateLimitMiddleware,
  type RateLimitResult,
  RATE_LIMIT_CONFIG
} from './rate-limiter-server';

// Re-export client hook for React components
export { useRateLimit } from './rate-limiter-client';