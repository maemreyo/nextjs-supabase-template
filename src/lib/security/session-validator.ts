/**
 * Session Security Utility
 * Provides session validation, authorization checks, and secure session management
 */

import { validateSessionId, validateInput } from './input-validator';

// Session configuration
const SESSION_CONFIG = {
  MAX_SESSION_AGE: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  MAX_INACTIVE_TIME: 30 * 60 * 1000, // 30 minutes of inactivity
  MAX_SESSIONS_PER_USER: 10, // Maximum concurrent sessions per user
  SESSION_ID_LENGTH: 32, // Length of generated session IDs
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute rate limit window
  MAX_REQUESTS_PER_WINDOW: 100, // Max requests per minute per session
  CLEANUP_INTERVAL: 5 * 60 * 1000, // Cleanup interval for expired sessions
};

// Session storage interface
interface SessionStorage {
  sessionId: string;
  userId: string;
  createdAt: number;
  lastAccessedAt: number;
  isActive: boolean;
  userAgent?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

// Rate limiting storage interface
interface RateLimitStorage {
  sessionId: string;
  requests: number;
  windowStart: number;
  lastReset: number;
}

// In-memory session storage (in production, use Redis or database)
const sessionStore = new Map<string, SessionStorage>();
const rateLimitStore = new Map<string, RateLimitStorage>();

/**
 * Generates a secure session ID
 * @returns Secure random session ID
 */
function generateSecureSessionId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < SESSION_CONFIG.SESSION_ID_LENGTH; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Creates a new session
 * @param userId - User ID to associate with the session
 * @param metadata - Optional session metadata
 * @returns Session creation result
 */
export function createSession(
  userId: string,
  metadata?: Record<string, any>,
  userAgent?: string,
  ipAddress?: string
): {
  success: boolean;
  sessionId?: string;
  error?: string;
} {
  try {
    // Validate user ID
    const userIdValidation = validateInput(userId, 'username');
    if (!userIdValidation.isValid) {
      return {
        success: false,
        error: 'Invalid user ID'
      };
    }

    // Check maximum sessions per user
    const userSessions = Array.from(sessionStore.values())
      .filter(session => session.userId === userId && session.isActive);
    
    if (userSessions.length >= SESSION_CONFIG.MAX_SESSIONS_PER_USER) {
      // Deactivate oldest session
      const oldestSession = userSessions
        .sort((a, b) => a.createdAt - b.createdAt)[0];
      if (oldestSession) {
        oldestSession.isActive = false;
      }
    }

    // Generate session ID
    const sessionId = generateSecureSessionId();

    // Create session
    const session: SessionStorage = {
      sessionId,
      userId,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      isActive: true,
      userAgent,
      ipAddress,
      metadata
    };

    sessionStore.set(sessionId, session);

    return {
      success: true,
      sessionId
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to create session'
    };
  }
}

/**
 * Validates a session ID and returns session information
 * @param sessionId - Session ID to validate
 * @returns Session validation result
 */
export function validateSession(sessionId: string): {
  isValid: boolean;
  session?: SessionStorage;
  error?: string;
} {
  try {
    // Validate session ID format
    const sessionIdValidation = validateSessionId(sessionId);
    if (!sessionIdValidation.isValid) {
      return {
        isValid: false,
        error: 'Invalid session ID format'
      };
    }

    // Check if session exists
    const session = sessionStore.get(sessionId);
    if (!session) {
      return {
        isValid: false,
        error: 'Session not found'
      };
    }

    // Check if session is active
    if (!session.isActive) {
      return {
        isValid: false,
        error: 'Session is inactive'
      };
    }

    // Check session age
    const now = Date.now();
    const sessionAge = now - session.createdAt;
    if (sessionAge > SESSION_CONFIG.MAX_SESSION_AGE) {
      session.isActive = false;
      return {
        isValid: false,
        error: 'Session expired'
      };
    }

    // Check inactive time
    const inactiveTime = now - session.lastAccessedAt;
    if (inactiveTime > SESSION_CONFIG.MAX_INACTIVE_TIME) {
      session.isActive = false;
      return {
        isValid: false,
        error: 'Session expired due to inactivity'
      };
    }

    // Update last accessed time
    session.lastAccessedAt = now;

    return {
      isValid: true,
      session
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to validate session'
    };
  }
}

/**
 * Checks if a session is authorized to access a resource
 * @param sessionId - Session ID to check
 * @param resourceUserId - User ID of the resource being accessed
 * @param action - Action being performed
 * @returns Authorization result
 */
export function authorizeSessionAccess(
  sessionId: string,
  resourceUserId: string,
  action: string = 'read'
): {
  isAuthorized: boolean;
  error?: string;
} {
  try {
    // Validate session
    const sessionValidation = validateSession(sessionId);
    if (!sessionValidation.isValid) {
      return {
        isAuthorized: false,
        error: sessionValidation.error || 'Invalid session'
      };
    }

    const session = sessionValidation.session!;

    // Check if user owns the resource
    if (session.userId !== resourceUserId) {
      return {
        isAuthorized: false,
        error: 'Unauthorized access to resource'
      };
    }

    // Additional action-based checks can be added here
    switch (action) {
      case 'read':
      case 'write':
      case 'delete':
        // All actions allowed for resource owner
        break;
      default:
        return {
          isAuthorized: false,
          error: 'Unauthorized action'
        };
    }

    return {
      isAuthorized: true
    };
  } catch (error) {
    return {
      isAuthorized: false,
      error: 'Failed to authorize access'
    };
  }
}

/**
 * Updates session metadata
 * @param sessionId - Session ID to update
 * @param metadata - New metadata to merge
 * @returns Update result
 */
export function updateSessionMetadata(
  sessionId: string,
  metadata: Record<string, any>
): {
  success: boolean;
  error?: string;
} {
  try {
    const sessionValidation = validateSession(sessionId);
    if (!sessionValidation.isValid) {
      return {
        success: false,
        error: sessionValidation.error || 'Invalid session'
      };
    }

    const session = sessionValidation.session!;
    session.metadata = { ...session.metadata, ...metadata };
    session.lastAccessedAt = Date.now();

    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to update session metadata'
    };
  }
}

/**
 * Destroys a session
 * @param sessionId - Session ID to destroy
 * @returns Destruction result
 */
export function destroySession(sessionId: string): {
  success: boolean;
  error?: string;
} {
  try {
    const sessionValidation = validateSession(sessionId);
    if (!sessionValidation.isValid) {
      return {
        success: false,
        error: sessionValidation.error || 'Invalid session'
      };
    }

    const session = sessionValidation.session!;
    session.isActive = false;

    // Clean up rate limiting data
    rateLimitStore.delete(sessionId);

    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to destroy session'
    };
  }
}

/**
 * Checks rate limiting for a session
 * @param sessionId - Session ID to check
 * @returns Rate limiting result
 */
export function checkRateLimit(sessionId: string): {
  allowed: boolean;
  remainingRequests: number;
  resetTime: number;
  error?: string;
} {
  try {
    const now = Date.now();
    let rateLimitData = rateLimitStore.get(sessionId);

    // Initialize rate limiting data if not exists
    if (!rateLimitData) {
      rateLimitData = {
        sessionId,
        requests: 0,
        windowStart: now,
        lastReset: now
      };
      rateLimitStore.set(sessionId, rateLimitData);
    }

    // Reset window if expired
    if (now - rateLimitData.windowStart > SESSION_CONFIG.RATE_LIMIT_WINDOW) {
      rateLimitData.requests = 0;
      rateLimitData.windowStart = now;
      rateLimitData.lastReset = now;
    }

    // Check if request is allowed
    if (rateLimitData.requests >= SESSION_CONFIG.MAX_REQUESTS_PER_WINDOW) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: rateLimitData.windowStart + SESSION_CONFIG.RATE_LIMIT_WINDOW
      };
    }

    // Increment request count
    rateLimitData.requests++;

    return {
      allowed: true,
      remainingRequests: SESSION_CONFIG.MAX_REQUESTS_PER_WINDOW - rateLimitData.requests,
      resetTime: rateLimitData.windowStart + SESSION_CONFIG.RATE_LIMIT_WINDOW
    };
  } catch (error) {
    return {
      allowed: false,
      remainingRequests: 0,
      resetTime: Date.now() + SESSION_CONFIG.RATE_LIMIT_WINDOW,
      error: 'Failed to check rate limit'
    };
  }
}

/**
 * Gets all active sessions for a user
 * @param userId - User ID to get sessions for
 * @returns User sessions
 */
export function getUserSessions(userId: string): {
  sessions: SessionStorage[];
  error?: string;
} {
  try {
    const sessions = Array.from(sessionStore.values())
      .filter(session => session.userId === userId && session.isActive)
      .sort((a, b) => b.lastAccessedAt - a.lastAccessedAt);

    return {
      sessions
    };
  } catch (error) {
    return {
      sessions: [],
      error: 'Failed to get user sessions'
    };
  }
}

/**
 * Cleans up expired sessions
 * @returns Cleanup result
 */
export function cleanupExpiredSessions(): {
  cleanedSessions: number;
  error?: string;
} {
  try {
    const now = Date.now();
    let cleanedSessions = 0;

    for (const [sessionId, session] of sessionStore.entries()) {
      const sessionAge = now - session.createdAt;
      const inactiveTime = now - session.lastAccessedAt;

      if (sessionAge > SESSION_CONFIG.MAX_SESSION_AGE || 
          inactiveTime > SESSION_CONFIG.MAX_INACTIVE_TIME) {
        session.isActive = false;
        rateLimitStore.delete(sessionId);
        cleanedSessions++;
      }
    }

    return {
      cleanedSessions
    };
  } catch (error) {
    return {
      cleanedSessions: 0,
      error: 'Failed to cleanup expired sessions'
    };
  }
}

/**
 * Gets session statistics
 * @returns Session statistics
 */
export function getSessionStats(): {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  averageSessionAge: number;
  error?: string;
} {
  try {
    const now = Date.now();
    const sessions = Array.from(sessionStore.values());
    const activeSessions = sessions.filter(session => session.isActive);
    const expiredSessions = sessions.filter(session => !session.isActive);

    const totalAge = activeSessions.reduce((sum, session) => sum + (now - session.createdAt), 0);
    const averageSessionAge = activeSessions.length > 0 ? totalAge / activeSessions.length : 0;

    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      expiredSessions: expiredSessions.length,
      averageSessionAge
    };
  } catch (error) {
    return {
      totalSessions: 0,
      activeSessions: 0,
      expiredSessions: 0,
      averageSessionAge: 0,
      error: 'Failed to get session statistics'
    };
  }
}

/**
 * Validates session for API access
 * @param sessionId - Session ID to validate
 * @param resourceUserId - Resource owner user ID
 * @param action - Action being performed
 * @returns Comprehensive validation result
 */
export function validateSessionForAPI(
  sessionId: string,
  resourceUserId?: string,
  action: string = 'read'
): {
  isValid: boolean;
  isAuthorized: boolean;
  rateLimitAllowed: boolean;
  session?: SessionStorage;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate session
  const sessionValidation = validateSession(sessionId);
  if (!sessionValidation.isValid) {
    errors.push(sessionValidation.error || 'Invalid session');
    return {
      isValid: false,
      isAuthorized: false,
      rateLimitAllowed: false,
      errors
    };
  }

  // Check authorization if resource user ID is provided
  let isAuthorized = true;
  if (resourceUserId) {
    const authResult = authorizeSessionAccess(sessionId, resourceUserId, action);
    if (!authResult.isAuthorized) {
      errors.push(authResult.error || 'Unauthorized access');
      isAuthorized = false;
    }
  }

  // Check rate limiting
  const rateLimitResult = checkRateLimit(sessionId);
  if (!rateLimitResult.allowed) {
    errors.push('Rate limit exceeded');
  }

  return {
    isValid: true,
    isAuthorized,
    rateLimitAllowed: rateLimitResult.allowed,
    session: sessionValidation.session,
    errors
  };
}

// Setup automatic cleanup
if (typeof window === 'undefined') {
  // Only run on server side
  setInterval(() => {
    cleanupExpiredSessions();
  }, SESSION_CONFIG.CLEANUP_INTERVAL);
}

// Export configuration for external use
export { SESSION_CONFIG };