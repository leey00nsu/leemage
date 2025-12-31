/**
 * Secure logging utilities for security hardening.
 * Implements sensitive data masking and security event logging.
 */

/**
 * Log levels
 */
export type LogLevel = "INFO" | "WARN" | "ERROR";

/**
 * Security event types
 */
export type SecurityEventType =
  | "AUTH_SUCCESS"
  | "AUTH_FAILURE"
  | "RATE_LIMIT"
  | "OWNERSHIP_DENIED"
  | "VALIDATION_FAILURE";

/**
 * Security event structure
 */
export interface SecurityEvent {
  type: SecurityEventType;
  timestamp: Date;
  ip: string;
  userId?: string;
  path?: string;
  method?: string;
  details: Record<string, unknown>;
}

/**
 * Masks an API key, showing only the prefix.
 * Format: "lmk_****" for keys starting with "lmk_"
 * 
 * @param apiKey - The API key to mask
 * @returns Masked API key
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || typeof apiKey !== "string") {
    return "****";
  }

  // Find prefix (everything before first underscore)
  const underscoreIndex = apiKey.indexOf("_");
  if (underscoreIndex === -1) {
    return "****";
  }

  const prefix = apiKey.slice(0, underscoreIndex + 1);
  return `${prefix}****`;
}

/**
 * Masks an email address, hiding the local part.
 * Format: "***@domain.com"
 * 
 * @param email - The email to mask
 * @returns Masked email
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== "string") {
    return "***";
  }

  const atIndex = email.indexOf("@");
  if (atIndex === -1) {
    return "***";
  }

  const domain = email.slice(atIndex);
  return `***${domain}`;
}

/**
 * Masks a username, showing only first character.
 * 
 * @param username - The username to mask
 * @returns Masked username
 */
export function maskUsername(username: string): string {
  if (!username || typeof username !== "string" || username.length === 0) {
    return "***";
  }

  return `${username[0]}***`;
}

/**
 * List of sensitive field names to mask
 */
const SENSITIVE_FIELDS = [
  "password",
  "apiKey",
  "api_key",
  "apikey",
  "token",
  "secret",
  "authorization",
  "cookie",
  "session",
  "credential",
];

/**
 * Masks sensitive fields in an object recursively.
 * 
 * @param data - The object to mask
 * @returns Object with sensitive fields masked
 */
export function maskSensitiveData<T extends Record<string, unknown>>(data: T): T {
  if (!data || typeof data !== "object") {
    return data;
  }

  const masked: Record<string, unknown> = { ...data };

  for (const key of Object.keys(masked)) {
    const lowerKey = key.toLowerCase();
    const value = masked[key];

    // Check if this is a sensitive field
    if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))) {
      masked[key] = "[REDACTED]";
      continue;
    }

    // Handle email fields
    if (lowerKey.includes("email") && typeof value === "string") {
      masked[key] = maskEmail(value);
      continue;
    }

    // Recursively mask nested objects
    if (value && typeof value === "object" && !Array.isArray(value)) {
      masked[key] = maskSensitiveData(value as Record<string, unknown>);
    }
  }

  return masked as T;
}

/**
 * Formats a security event for logging.
 */
function formatSecurityEvent(event: SecurityEvent, level: LogLevel): string {
  const timestamp = event.timestamp.toISOString();
  const userId = event.userId ? maskUsername(event.userId) : "anonymous";
  
  // Mask sensitive data in details
  const maskedDetails = maskSensitiveData(event.details as Record<string, unknown>);
  
  return JSON.stringify({
    level,
    timestamp,
    type: event.type,
    ip: event.ip,
    userId,
    path: event.path,
    method: event.method,
    details: maskedDetails,
  });
}

/**
 * Logs a security event with proper formatting and masking.
 * 
 * @param event - The security event to log
 * @param level - Log level (default: INFO)
 */
export function logSecurityEvent(
  event: SecurityEvent,
  level: LogLevel = "INFO"
): void {
  const formatted = formatSecurityEvent(event, level);

  switch (level) {
    case "ERROR":
      console.error(`[SECURITY] ${formatted}`);
      break;
    case "WARN":
      console.warn(`[SECURITY] ${formatted}`);
      break;
    default:
      console.log(`[SECURITY] ${formatted}`);
  }
}

/**
 * Logger interface
 */
export interface SecureLogger {
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
  security: (event: Omit<SecurityEvent, "timestamp">) => void;
}

/**
 * Creates a secure logger instance with context.
 * 
 * @param context - Logger context (e.g., module name)
 * @returns SecureLogger instance
 */
export function createSecureLogger(context: string): SecureLogger {
  const formatMessage = (
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>
  ): string => {
    const timestamp = new Date().toISOString();
    const maskedData = data ? maskSensitiveData(data) : undefined;
    
    return JSON.stringify({
      level,
      timestamp,
      context,
      message,
      ...(maskedData && { data: maskedData }),
    });
  };

  return {
    info: (message: string, data?: Record<string, unknown>) => {
      console.log(formatMessage("INFO", message, data));
    },
    warn: (message: string, data?: Record<string, unknown>) => {
      console.warn(formatMessage("WARN", message, data));
    },
    error: (message: string, data?: Record<string, unknown>) => {
      // In production, don't include stack traces
      if (process.env.NODE_ENV === "production" && data?.stack) {
        const { stack, ...rest } = data;
        console.error(formatMessage("ERROR", message, rest));
      } else {
        console.error(formatMessage("ERROR", message, data));
      }
    },
    security: (event: Omit<SecurityEvent, "timestamp">) => {
      logSecurityEvent({
        ...event,
        timestamp: new Date(),
      });
    },
  };
}

/**
 * Pre-configured loggers for common modules
 */
export const authLogger = createSecureLogger("auth");
export const apiLogger = createSecureLogger("api");
export const storageLogger = createSecureLogger("storage");
