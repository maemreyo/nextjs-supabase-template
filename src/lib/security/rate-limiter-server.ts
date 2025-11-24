/**
 * Server-Safe Rate Limiting Utility
 * Provides comprehensive rate limiting for API calls and user actions
 * No React hooks - safe for use in API routes and server components
 */

import { cacheManager } from '@/lib/performance/cache-manager';

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  // API rate limits
  API_REQUESTS_PER_MINUTE: 100,
  API_REQUESTS_PER_HOUR: 1000,
  API_REQUESTS_PER_DAY: 10000,
  
  // Analysis rate limits
  ANALYSIS_REQUESTS_PER_MINUTE: 10,
  ANALYSIS_REQUESTS_PER_HOUR: 100,
  ANALYSIS_REQUESTS_PER_DAY: 500,
  
  // Session rate limits
  SESSION_OPERATIONS_PER_MINUTE: 20,
  SESSION_OPERATIONS_PER_HOUR: 200,
  
  // Authentication rate limits
  AUTH_ATTEMPTS_PER_MINUTE: 5,
  AUTH_ATTEMPTS_PER_HOUR: 20,
  
  // Default window sizes in milliseconds
  MINUTE_WINDOW: 60 * 1000,
  HOUR_WINDOW: 60 * 60 * 1000,
  DAY_WINDOW: 24 * 60 * 60 * 1000,
};

// Rate limit entry interface
interface RateLimitEntry {
  count: number;
  windowStart: number;
  lastReset: number;
  blockedUntil?: number;
}

// Rate limit result interface
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  error?: string;
}

// Rate limiter class
class RateLimiter {
  private cacheKey: string;
  private maxRequests: number;
  private windowMs: number;

  constructor(cacheKey: string, maxRequests: number, windowMs: number) {
    this.cacheKey = cacheKey;
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  check(identifier: string): RateLimitResult {
    const now = Date.now();
    const key = `${this.cacheKey}:${identifier}`;
    
    // Get or create rate limit entry
    const cache = cacheManager.getCache<RateLimitEntry>('rate-limiter');
    let entry = cache?.get(key);

    if (!entry) {
      entry = {
        count: 0,
        windowStart: now,
        lastReset: now
      };
    }

    // Check if currently blocked
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.blockedUntil,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
        error: 'Rate limit exceeded. Please try again later.'
      };
    }

    // Reset window if expired
    if (now - entry.windowStart > this.windowMs) {
      entry.count = 0;
      entry.windowStart = now;
      entry.lastReset = now;
      entry.blockedUntil = undefined;
    }

    // Check if request is allowed
    if (entry.count >= this.maxRequests) {
      // Block for exponential backoff
      const blockDuration = Math.min(this.windowMs, Math.pow(2, entry.count - this.maxRequests + 1) * 1000);
      entry.blockedUntil = now + blockDuration;
      
      // Save updated entry
      cache?.set(key, entry, { ttl: this.windowMs });

      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.blockedUntil,
        retryAfter: Math.ceil(blockDuration / 1000),
        error: 'Rate limit exceeded. Please try again later.'
      };
    }

    // Increment count and save
    entry.count++;
    cache?.set(key, entry, { ttl: this.windowMs });

    return {
      allowed: true,
      remaining: Math.max(0, this.maxRequests - entry.count),
      resetTime: entry.windowStart + this.windowMs
    };
  }

  reset(identifier: string): void {
    const key = `${this.cacheKey}:${identifier}`;
    const cache = cacheManager.getCache<RateLimitEntry>('rate-limiter');
    cache?.delete(key);
  }

  getStatus(identifier: string): RateLimitResult {
    const now = Date.now();
    const key = `${this.cacheKey}:${identifier}`;
    
    const cache = cacheManager.getCache<RateLimitEntry>('rate-limiter');
    const entry = cache?.get(key);

    if (!entry) {
      return {
        allowed: true,
        remaining: this.maxRequests,
        resetTime: now + this.windowMs
      };
    }

    if (entry.blockedUntil && now < entry.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.blockedUntil,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
        error: 'Rate limit exceeded. Please try again later.'
      };
    }

    // Reset window if expired
    if (now - entry.windowStart > this.windowMs) {
      return {
        allowed: true,
        remaining: this.maxRequests,
        resetTime: now + this.windowMs
      };
    }

    return {
      allowed: entry.count < this.maxRequests,
      remaining: Math.max(0, this.maxRequests - entry.count),
      resetTime: entry.windowStart + this.windowMs
    };
  }
}

// Predefined rate limiters
const rateLimiters = {
  apiMinute: new RateLimiter('api:minute', RATE_LIMIT_CONFIG.API_REQUESTS_PER_MINUTE, RATE_LIMIT_CONFIG.MINUTE_WINDOW),
  apiHour: new RateLimiter('api:hour', RATE_LIMIT_CONFIG.API_REQUESTS_PER_HOUR, RATE_LIMIT_CONFIG.HOUR_WINDOW),
  apiDay: new RateLimiter('api:day', RATE_LIMIT_CONFIG.API_REQUESTS_PER_DAY, RATE_LIMIT_CONFIG.DAY_WINDOW),
  
  analysisMinute: new RateLimiter('analysis:minute', RATE_LIMIT_CONFIG.ANALYSIS_REQUESTS_PER_MINUTE, RATE_LIMIT_CONFIG.MINUTE_WINDOW),
  analysisHour: new RateLimiter('analysis:hour', RATE_LIMIT_CONFIG.ANALYSIS_REQUESTS_PER_HOUR, RATE_LIMIT_CONFIG.HOUR_WINDOW),
  analysisDay: new RateLimiter('analysis:day', RATE_LIMIT_CONFIG.ANALYSIS_REQUESTS_PER_DAY, RATE_LIMIT_CONFIG.DAY_WINDOW),
  
  sessionMinute: new RateLimiter('session:minute', RATE_LIMIT_CONFIG.SESSION_OPERATIONS_PER_MINUTE, RATE_LIMIT_CONFIG.MINUTE_WINDOW),
  sessionHour: new RateLimiter('session:hour', RATE_LIMIT_CONFIG.SESSION_OPERATIONS_PER_HOUR, RATE_LIMIT_CONFIG.HOUR_WINDOW),
  
  authMinute: new RateLimiter('auth:minute', RATE_LIMIT_CONFIG.AUTH_ATTEMPTS_PER_MINUTE, RATE_LIMIT_CONFIG.MINUTE_WINDOW),
  authHour: new RateLimiter('auth:hour', RATE_LIMIT_CONFIG.AUTH_ATTEMPTS_PER_HOUR, RATE_LIMIT_CONFIG.HOUR_WINDOW),
};

// Rate limiting functions
export const rateLimiting = {
  // API rate limiting
  checkApiRequest: (identifier: string): RateLimitResult => {
    const minuteResult = rateLimiters.apiMinute.check(identifier);
    const hourResult = rateLimiters.apiHour.check(identifier);
    const dayResult = rateLimiters.apiDay.check(identifier);

    // Use most restrictive limit
    const results = [minuteResult, hourResult, dayResult];
    const mostRestrictive = results.reduce((prev, curr) => 
      !curr.allowed || curr.remaining < prev.remaining ? curr : prev
    );

    return mostRestrictive;
  },

  getApiStatus: (identifier: string): RateLimitResult => {
    const minuteResult = rateLimiters.apiMinute.getStatus(identifier);
    const hourResult = rateLimiters.apiHour.getStatus(identifier);
    const dayResult = rateLimiters.apiDay.getStatus(identifier);

    const results = [minuteResult, hourResult, dayResult];
    return results.reduce((prev, curr) => 
      !curr.allowed || curr.remaining < prev.remaining ? curr : prev
    );
  },

  resetApiLimit: (identifier: string): void => {
    rateLimiters.apiMinute.reset(identifier);
    rateLimiters.apiHour.reset(identifier);
    rateLimiters.apiDay.reset(identifier);
  },

  // Analysis rate limiting
  checkAnalysisRequest: (identifier: string): RateLimitResult => {
    const minuteResult = rateLimiters.analysisMinute.check(identifier);
    const hourResult = rateLimiters.analysisHour.check(identifier);
    const dayResult = rateLimiters.analysisDay.check(identifier);

    const results = [minuteResult, hourResult, dayResult];
    return results.reduce((prev, curr) => 
      !curr.allowed || curr.remaining < prev.remaining ? curr : prev
    );
  },

  getAnalysisStatus: (identifier: string): RateLimitResult => {
    const minuteResult = rateLimiters.analysisMinute.getStatus(identifier);
    const hourResult = rateLimiters.analysisHour.getStatus(identifier);
    const dayResult = rateLimiters.analysisDay.getStatus(identifier);

    const results = [minuteResult, hourResult, dayResult];
    return results.reduce((prev, curr) => 
      !curr.allowed || curr.remaining < prev.remaining ? curr : prev
    );
  },

  resetAnalysisLimit: (identifier: string): void => {
    rateLimiters.analysisMinute.reset(identifier);
    rateLimiters.analysisHour.reset(identifier);
    rateLimiters.analysisDay.reset(identifier);
  },

  // Session rate limiting
  checkSessionOperation: (identifier: string): RateLimitResult => {
    const minuteResult = rateLimiters.sessionMinute.check(identifier);
    const hourResult = rateLimiters.sessionHour.check(identifier);

    const results = [minuteResult, hourResult];
    return results.reduce((prev, curr) => 
      !curr.allowed || curr.remaining < prev.remaining ? curr : prev
    );
  },

  getSessionStatus: (identifier: string): RateLimitResult => {
    const minuteResult = rateLimiters.sessionMinute.getStatus(identifier);
    const hourResult = rateLimiters.sessionHour.getStatus(identifier);

    const results = [minuteResult, hourResult];
    return results.reduce((prev, curr) => 
      !curr.allowed || curr.remaining < prev.remaining ? curr : prev
    );
  },

  resetSessionLimit: (identifier: string): void => {
    rateLimiters.sessionMinute.reset(identifier);
    rateLimiters.sessionHour.reset(identifier);
  },

  // Authentication rate limiting
  checkAuthAttempt: (identifier: string): RateLimitResult => {
    const minuteResult = rateLimiters.authMinute.check(identifier);
    const hourResult = rateLimiters.authHour.check(identifier);

    const results = [minuteResult, hourResult];
    return results.reduce((prev, curr) => 
      !curr.allowed || curr.remaining < prev.remaining ? curr : prev
    );
  },

  getAuthStatus: (identifier: string): RateLimitResult => {
    const minuteResult = rateLimiters.authMinute.getStatus(identifier);
    const hourResult = rateLimiters.authHour.getStatus(identifier);

    const results = [minuteResult, hourResult];
    return results.reduce((prev, curr) => 
      !curr.allowed || curr.remaining < prev.remaining ? curr : prev
    );
  },

  resetAuthLimit: (identifier: string): void => {
    rateLimiters.authMinute.reset(identifier);
    rateLimiters.authHour.reset(identifier);
  }
};

// Custom rate limiter factory
export function createRateLimiter(
  cacheKey: string,
  maxRequests: number,
  windowMs: number
): RateLimiter {
  return new RateLimiter(cacheKey, maxRequests, windowMs);
}

// Rate limiting middleware for API routes
export function rateLimitMiddleware(
  type: 'api' | 'analysis' | 'session' | 'auth',
  getIdentifier: (req: Request) => string
) {
  return async (req: Request, next: () => Promise<Response>) => {
    const identifier = getIdentifier(req);
    
    let result: RateLimitResult;
    switch (type) {
      case 'api':
        result = rateLimiting.checkApiRequest(identifier);
        break;
      case 'analysis':
        result = rateLimiting.checkAnalysisRequest(identifier);
        break;
      case 'session':
        result = rateLimiting.checkSessionOperation(identifier);
        break;
      case 'auth':
        result = rateLimiting.checkAuthAttempt(identifier);
        break;
      default:
        result = { allowed: true, remaining: 1, resetTime: Date.now() + 60000 };
    }

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: result.error,
          retryAfter: result.retryAfter,
          resetTime: result.resetTime
        }),
        {
          status: 429,
          statusText: 'Too Many Requests',
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': result.retryAfter?.toString() || '60'
          }
        }
      );
    }

    const response = await next();
    
    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
    
    return response;
  };
}

// Export types and configuration for external use
export type { RateLimitResult };
export { RATE_LIMIT_CONFIG };