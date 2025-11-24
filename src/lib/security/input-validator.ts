/**
 * Input Validation Utility
 * Provides comprehensive validation for user inputs to prevent injection attacks
 */

// Validation patterns
const PATTERNS = {
  // Email validation
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // Username validation (alphanumeric, underscore, hyphen, 3-30 chars)
  USERNAME: /^[a-zA-Z0-9_-]{3,30}$/,
  
  // Strong password validation (min 8 chars, uppercase, lowercase, number, special char)
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  
  // Medium password validation (min 6 chars, letters and numbers)
  MEDIUM_PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/,
  
  // Session ID validation (UUID-like format)
  SESSION_ID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  
  // Analysis text validation (allow common characters, limit dangerous ones)
  ANALYSIS_TEXT: /^[\s\S]{1,10000}$/,
  
  // Word validation (single word or short phrase)
  WORD: /^[\w\s\-.,!?;:'"()]{1,100}$/,
  
  // URL validation
  URL: /^https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?$/,
  
  // File name validation
  FILENAME: /^[a-zA-Z0-9._-]{1,255}$/,
  
  // Numeric validation
  NUMERIC: /^[0-9]+$/,
  
  // Decimal validation
  DECIMAL: /^[0-9]*\.?[0-9]+$/
};

// Length constraints
const LENGTH_CONSTRAINTS = {
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 30,
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 128,
  MIN_SESSION_NAME_LENGTH: 1,
  MAX_SESSION_NAME_LENGTH: 100,
  MIN_ANALYSIS_LENGTH: 1,
  MAX_ANALYSIS_LENGTH: 10000,
  MIN_WORD_LENGTH: 1,
  MAX_WORD_LENGTH: 100,
  MAX_EMAIL_LENGTH: 254,
  MAX_URL_LENGTH: 2048
};

// SQL injection patterns to detect
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
  /(--|\*\/|\/\*)/,
  /(\bOR\b.*=.*\bOR\b)/i,
  /(\bAND\b.*=.*\bAND\b)/i,
  /(\bWHERE\b.*\bOR\b)/i,
  /(\bWHERE\b.*\bAND\b)/i,
  /(\bHAVING\b.*\bOR\b)/i,
  /(\bHAVING\b.*\bAND\b)/i,
  /(\bGROUP BY\b.*\bHAVING\b)/i,
  /(\bORDER BY\b.*\bHAVING\b)/i,
  /(\bUNION\b.*\bSELECT\b)/i,
  /(\bUNION\b.*\bALL\b.*\bSELECT\b)/i,
  /(\bEXEC\b.*\()/i,
  /(\bEXECUTE\b.*\()/i,
  /(\bSP_EXECUTESQL\b)/i,
  /(\bXP_CMDSHELL\b)/i,
  /(\bXP_REGREAD\b)/i,
  /(\bXP_REGWRITE\b)/i,
  /(\bXP_REGENUMVALUES\b)/i,
  /(\bXP_REGDELETEKEY\b)/i,
  /(\bXP_REGDELETEVALUE\b)/i,
  /(\bXP_LOGINCONFIG\b)/i,
  /(\bXP_CONFIGURE\b)/i,
  /(\bXP_MAKECAB\b)/i,
  /(\bXP_UNMAKECAB\b)/i,
  /(\bXP_SERVICECONTROL\b)/i,
  /(\bXP_ATTACHDB\b)/i,
  /(\bXP_DETACHDB\b)/i,
  /(\bXP_FILEEXIST\b)/i,
  /(\bXP_GETFILEDETAILS\b)/i,
  /(\bXP_FILELIST\b)/i,
  /(\bXP_GETNETNAME\b)/i,
  /(\bXP_READERRORLOG\b)/i,
  /(\bXP_READMAIL\b)/i,
  /(\bXP_STARTMAIL\b)/i,
  /(\bXP_STOPMAIL\b)/i,
  /(\bXP_SENDMAIL\b)/i,
  /(\bXP_DELEMAIL\b)/i,
  /(\bXP_FINDNEXTMSG\b)/i,
  /(\bXP_GRANTLOGIN\b)/i,
  /(\bXP_LOGININFO\b)/i,
  /(\bXP_REVOKELLOGIN\b)/i
];

// XSS patterns to detect
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /<object[^>]*>.*?<\/object>/gi,
  /<embed[^>]*>.*?<\/embed>/gi,
  /<form[^>]*>.*?<\/form>/gi,
  /<input[^>]*>/gi,
  /<button[^>]*>.*?<\/button>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /on\w+\s*=/gi,
  /<\s*script/gi,
  /<\s*iframe/gi,
  /<\s*object/gi,
  /<\s*embed/gi,
  /<\s*form/gi,
  /<\s*input/gi,
  /<\s*button/gi
];

/**
 * Validates email format
 * @param email - The email to validate
 * @returns Validation result
 */
export function validateEmail(email: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  if (email.length > LENGTH_CONSTRAINTS.MAX_EMAIL_LENGTH) {
    errors.push(`Email cannot exceed ${LENGTH_CONSTRAINTS.MAX_EMAIL_LENGTH} characters`);
  }

  if (!PATTERNS.EMAIL.test(email)) {
    errors.push('Invalid email format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates password strength
 * @param password - The password to validate
 * @param strength - Required strength ('medium' | 'strong')
 * @returns Validation result
 */
export function validatePassword(password: string, strength: 'medium' | 'strong' = 'medium'): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} {
  const errors: string[] = [];
  let passwordStrength: 'weak' | 'medium' | 'strong' = 'weak';

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors, strength: 'weak' };
  }

  if (password.length < LENGTH_CONSTRAINTS.MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${LENGTH_CONSTRAINTS.MIN_PASSWORD_LENGTH} characters long`);
  }

  if (password.length > LENGTH_CONSTRAINTS.MAX_PASSWORD_LENGTH) {
    errors.push(`Password cannot exceed ${LENGTH_CONSTRAINTS.MAX_PASSWORD_LENGTH} characters`);
  }

  // Check strength
  if (PATTERNS.STRONG_PASSWORD.test(password)) {
    passwordStrength = 'strong';
  } else if (PATTERNS.MEDIUM_PASSWORD.test(password)) {
    passwordStrength = 'medium';
  }

  if (strength === 'strong' && passwordStrength !== 'strong') {
    errors.push('Password must contain at least 8 characters, including uppercase, lowercase, number, and special character');
  } else if (strength === 'medium' && passwordStrength === 'weak') {
    errors.push('Password must contain at least 6 characters, including letters and numbers');
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: passwordStrength
  };
}

/**
 * Validates username format
 * @param username - The username to validate
 * @returns Validation result
 */
export function validateUsername(username: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!username || typeof username !== 'string') {
    errors.push('Username is required');
    return { isValid: false, errors };
  }

  if (username.length < LENGTH_CONSTRAINTS.MIN_USERNAME_LENGTH) {
    errors.push(`Username must be at least ${LENGTH_CONSTRAINTS.MIN_USERNAME_LENGTH} characters long`);
  }

  if (username.length > LENGTH_CONSTRAINTS.MAX_USERNAME_LENGTH) {
    errors.push(`Username cannot exceed ${LENGTH_CONSTRAINTS.MAX_USERNAME_LENGTH} characters`);
  }

  if (!PATTERNS.USERNAME.test(username)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates session ID format
 * @param sessionId - The session ID to validate
 * @returns Validation result
 */
export function validateSessionId(sessionId: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!sessionId || typeof sessionId !== 'string') {
    errors.push('Session ID is required');
    return { isValid: false, errors };
  }

  if (!PATTERNS.SESSION_ID.test(sessionId)) {
    errors.push('Invalid session ID format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates analysis text input
 * @param text - The analysis text to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validateAnalysisText(text: string, options: {
  minLength?: number;
  maxLength?: number;
  allowEmpty?: boolean;
} = {}): {
  isValid: boolean;
  errors: string[];
  sanitized: string;
} {
  const { minLength = LENGTH_CONSTRAINTS.MIN_ANALYSIS_LENGTH, maxLength = LENGTH_CONSTRAINTS.MAX_ANALYSIS_LENGTH, allowEmpty = false } = options;
  const errors: string[] = [];

  if (!text || typeof text !== 'string') {
    if (!allowEmpty) {
      errors.push('Analysis text is required');
    }
    return { isValid: errors.length === 0, errors, sanitized: '' };
  }

  const trimmedText = text.trim();

  if (!allowEmpty && trimmedText.length === 0) {
    errors.push('Analysis text cannot be empty');
  }

  if (trimmedText.length < minLength) {
    errors.push(`Analysis text must be at least ${minLength} characters long`);
  }

  if (trimmedText.length > maxLength) {
    errors.push(`Analysis text cannot exceed ${maxLength} characters`);
  }

  // Check for SQL injection
  const hasSQLInjection = SQL_INJECTION_PATTERNS.some(pattern => pattern.test(trimmedText));
  if (hasSQLInjection) {
    errors.push('Analysis text contains potentially dangerous SQL patterns');
  }

  // Check for XSS
  const hasXSS = XSS_PATTERNS.some(pattern => pattern.test(trimmedText));
  if (hasXSS) {
    errors.push('Analysis text contains potentially dangerous script patterns');
  }

  // Basic sanitization
  let sanitized = trimmedText;
  
  // Remove null bytes and other dangerous characters
  sanitized = sanitized.replace(/\0/g, '');
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Validates word input for analysis
 * @param word - The word to validate
 * @returns Validation result
 */
export function validateWord(word: string): {
  isValid: boolean;
  errors: string[];
  sanitized: string;
} {
  const errors: string[] = [];

  if (!word || typeof word !== 'string') {
    errors.push('Word is required');
    return { isValid: false, errors, sanitized: '' };
  }

  const trimmedWord = word.trim();

  if (trimmedWord.length === 0) {
    errors.push('Word cannot be empty');
  }

  if (trimmedWord.length < LENGTH_CONSTRAINTS.MIN_WORD_LENGTH) {
    errors.push(`Word must be at least ${LENGTH_CONSTRAINTS.MIN_WORD_LENGTH} character long`);
  }

  if (trimmedWord.length > LENGTH_CONSTRAINTS.MAX_WORD_LENGTH) {
    errors.push(`Word cannot exceed ${LENGTH_CONSTRAINTS.MAX_WORD_LENGTH} characters`);
  }

  if (!PATTERNS.WORD.test(trimmedWord)) {
    errors.push('Word contains invalid characters');
  }

  // Basic sanitization
  let sanitized = trimmedWord;
  sanitized = sanitized.replace(/\0/g, '');
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Validates URL format
 * @param url - The URL to validate
 * @returns Validation result
 */
export function validateURL(url: string): {
  isValid: boolean;
  errors: string[];
  sanitized: string;
} {
  const errors: string[] = [];

  if (!url || typeof url !== 'string') {
    errors.push('URL is required');
    return { isValid: false, errors, sanitized: '' };
  }

  const trimmedUrl = url.trim();

  if (trimmedUrl.length === 0) {
    errors.push('URL cannot be empty');
  }

  if (trimmedUrl.length > LENGTH_CONSTRAINTS.MAX_URL_LENGTH) {
    errors.push(`URL cannot exceed ${LENGTH_CONSTRAINTS.MAX_URL_LENGTH} characters`);
  }

  if (!PATTERNS.URL.test(trimmedUrl)) {
    errors.push('Invalid URL format');
  }

  // Basic sanitization
  let sanitized = trimmedUrl;
  sanitized = sanitized.replace(/\0/g, '');
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Validates numeric input
 * @param value - The value to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validateNumeric(value: string, options: {
  min?: number;
  max?: number;
  allowDecimal?: boolean;
} = {}): {
  isValid: boolean;
  errors: string[];
  parsedValue?: number;
} {
  const { min, max, allowDecimal = false } = options;
  const errors: string[] = [];

  if (!value || typeof value !== 'string') {
    errors.push('Value is required');
    return { isValid: false, errors };
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    errors.push('Value cannot be empty');
  }

  const pattern = allowDecimal ? PATTERNS.DECIMAL : PATTERNS.NUMERIC;
  if (!pattern.test(trimmedValue)) {
    errors.push('Value must be a valid number');
  }

  let parsedValue: number | undefined;
  try {
    parsedValue = allowDecimal ? parseFloat(trimmedValue) : parseInt(trimmedValue, 10);
    
    if (isNaN(parsedValue)) {
      errors.push('Value is not a valid number');
      parsedValue = undefined;
    } else {
      if (min !== undefined && parsedValue < min) {
        errors.push(`Value must be at least ${min}`);
      }
      
      if (max !== undefined && parsedValue > max) {
        errors.push(`Value must be at most ${max}`);
      }
    }
  } catch (error) {
    errors.push('Failed to parse number');
  }

  return {
    isValid: errors.length === 0,
    errors,
    parsedValue
  };
}

/**
 * Comprehensive input validation for any type of input
 * @param input - The input to validate
 * @param type - The type of validation to apply
 * @param options - Additional validation options
 * @returns Validation result
 */
export function validateInput(
  input: string,
  type: 'email' | 'password' | 'username' | 'sessionId' | 'analysisText' | 'word' | 'url' | 'numeric',
  options: any = {}
): {
  isValid: boolean;
  errors: string[];
  sanitized?: string;
  parsedValue?: any;
  strength?: string;
} {
  switch (type) {
    case 'email':
      return validateEmail(input);
    case 'password':
      return validatePassword(input, options.strength);
    case 'username':
      return validateUsername(input);
    case 'sessionId':
      return validateSessionId(input);
    case 'analysisText':
      return validateAnalysisText(input, options);
    case 'word':
      return validateWord(input);
    case 'url':
      return validateURL(input);
    case 'numeric':
      return validateNumeric(input, options);
    default:
      return {
        isValid: false,
        errors: ['Unknown validation type']
      };
  }
}

/**
 * Checks if input contains SQL injection patterns
 * @param input - The input to check
 * @returns True if SQL injection is detected
 */
export function detectSQLInjection(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Checks if input contains XSS patterns
 * @param input - The input to check
 * @returns True if XSS is detected
 */
export function detectXSS(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  return XSS_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Comprehensive security check for input
 * @param input - The input to check
 * @returns Security check result
 */
export function securityCheck(input: string): {
  isSafe: boolean;
  threats: string[];
  sanitized: string;
} {
  const threats: string[] = [];

  if (!input || typeof input !== 'string') {
    return {
      isSafe: false,
      threats: ['Invalid input type'],
      sanitized: ''
    };
  }

  let sanitized = input.trim();

  // Check for SQL injection
  if (detectSQLInjection(sanitized)) {
    threats.push('SQL injection detected');
  }

  // Check for XSS
  if (detectXSS(sanitized)) {
    threats.push('XSS detected');
  }

  // Basic sanitization
  sanitized = sanitized.replace(/\0/g, '');
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return {
    isSafe: threats.length === 0,
    threats,
    sanitized
  };
}

// Export patterns and constraints for external use
export { PATTERNS, LENGTH_CONSTRAINTS, SQL_INJECTION_PATTERNS, XSS_PATTERNS };