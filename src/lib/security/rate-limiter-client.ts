/**
 * Client-Side Rate Limiting Hook
 * React hooks for rate limiting in client components
 * Must be used with "use client" directive in React components
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { rateLimiting, type RateLimitResult } from './rate-limiter-server';

// Rate limiting hook for React components
export function useRateLimit(
  identifier: string,
  type: 'api' | 'analysis' | 'session' | 'auth'
): {
  isAllowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  error?: string;
  check: () => RateLimitResult;
  reset: () => void;
} {
  const [status, setStatus] = useState<RateLimitResult>({
    allowed: true,
    remaining: 100,
    resetTime: Date.now() + 60000
  });

  const check = useCallback(() => {
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
        result = { allowed: true, remaining: 100, resetTime: Date.now() + 60000 };
    }
    
    setStatus(result);
    return result;
  }, [identifier, type]);

  const reset = useCallback(() => {
    switch (type) {
      case 'api':
        rateLimiting.resetApiLimit(identifier);
        break;
      case 'analysis':
        rateLimiting.resetAnalysisLimit(identifier);
        break;
      case 'session':
        rateLimiting.resetSessionLimit(identifier);
        break;
      case 'auth':
        rateLimiting.resetAuthLimit(identifier);
        break;
    }
    
    setStatus({
      allowed: true,
      remaining: 100,
      resetTime: Date.now() + 60000
    });
  }, [identifier, type]);

  // Auto-refresh status
  useEffect(() => {
    const interval = setInterval(() => {
      const currentStatus = (() => {
        switch (type) {
          case 'api':
            return rateLimiting.getApiStatus(identifier);
          case 'analysis':
            return rateLimiting.getAnalysisStatus(identifier);
          case 'session':
            return rateLimiting.getSessionStatus(identifier);
          case 'auth':
            return rateLimiting.getAuthStatus(identifier);
          default:
            return { allowed: true, remaining: 100, resetTime: Date.now() + 60000 };
        }
      })();
      
      setStatus(currentStatus);
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [identifier, type]);

  return {
    isAllowed: status.allowed,
    remaining: status.remaining,
    resetTime: status.resetTime,
    retryAfter: status.retryAfter,
    error: status.error,
    check,
    reset
  };
}