import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import {
  maskApiKey,
  maskEmail,
  maskUsername,
  maskSensitiveData,
  logSecurityEvent,
  createSecureLogger,
  SecurityEvent,
} from "@/lib/logging/secure-logger";

/**
 * Secure Logger Tests
 * 
 * **Feature: security-hardening**
 * **Property 8: API Key Masking Format**
 * **Property 9: Email Masking Privacy**
 * 
 * Note: Property tests cover the core security invariants.
 * Unit tests focus on edge cases and integration behaviors.
 */

describe("Secure Logger", () => {
  /**
   * Property 8: API Key Masking Format
   * For any API key with prefix "lmk_", the maskApiKey function
   * SHALL return a string in format "lmk_****" preserving only the prefix.
   */
  describe("Property 8: API Key Masking Format", () => {
    it("should always preserve prefix and mask the rest", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }).filter((s) => /^[a-zA-Z0-9]+$/.test(s)),
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes("_")),
          (prefix, secret) => {
            const apiKey = `${prefix}_${secret}`;
            const masked = maskApiKey(apiKey);
            expect(masked).toBe(`${prefix}_****`);
            if (secret.length > 4) {
              expect(masked).not.toContain(secret);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should never expose the secret part of the key", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 50 }).filter((s) => !s.includes("_") && /^[a-zA-Z0-9]+$/.test(s)),
          (secret) => {
            const apiKey = `lmk_${secret}`;
            const masked = maskApiKey(apiKey);
            expect(masked).not.toContain(secret);
            expect(masked).toBe("lmk_****");
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // maskApiKey: Edge cases not covered by Property 8
  describe("maskApiKey - edge cases", () => {
    it("should handle keys without underscore", () => {
      expect(maskApiKey("noseparator")).toBe("****");
    });

    it("should handle empty or invalid input", () => {
      expect(maskApiKey("")).toBe("****");
      expect(maskApiKey(null as unknown as string)).toBe("****");
      expect(maskApiKey(undefined as unknown as string)).toBe("****");
    });
  });

  /**
   * Property 9: Email Masking Privacy
   * For any email address, the maskEmail function SHALL return a string
   * that does NOT contain the local part (before @) in plaintext.
   */
  describe("Property 9: Email Masking Privacy", () => {
    it("should never expose the local part of the email", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 30 }).filter((s) => !s.includes("@") && /^[a-z]+$/.test(s)),
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => !s.includes("@") && /^[a-z]+$/.test(s)),
          (localPart, domain) => {
            if (domain.includes(localPart)) return;
            
            const email = `${localPart}@${domain}.com`;
            const masked = maskEmail(email);
            expect(masked).not.toContain(localPart);
            expect(masked).toContain(`@${domain}.com`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should always start with masking characters", () => {
      fc.assert(
        fc.property(
          fc.emailAddress(),
          (email) => {
            const masked = maskEmail(email);
            expect(masked.startsWith("***")).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // maskEmail: Edge cases not covered by Property 9
  describe("maskEmail - edge cases", () => {
    it("should handle invalid emails", () => {
      expect(maskEmail("notanemail")).toBe("***");
      expect(maskEmail("")).toBe("***");
    });
  });

  // maskUsername: Not covered by property tests
  describe("maskUsername", () => {
    it("should show only first character", () => {
      expect(maskUsername("johndoe")).toBe("j***");
      expect(maskUsername("admin")).toBe("a***");
    });

    it("should handle empty input", () => {
      expect(maskUsername("")).toBe("***");
      expect(maskUsername(null as unknown as string)).toBe("***");
    });
  });

  // maskSensitiveData: Integration tests
  describe("maskSensitiveData", () => {
    it("should mask password fields", () => {
      const data = { username: "john", password: "secret123" };
      const masked = maskSensitiveData(data);
      expect(masked.username).toBe("john");
      expect(masked.password).toBe("[REDACTED]");
    });

    it("should mask API key fields", () => {
      const data = { apiKey: "lmk_secret", name: "test" };
      const masked = maskSensitiveData(data);
      expect(masked.apiKey).toBe("[REDACTED]");
    });

    it("should mask email fields", () => {
      const data = { userEmail: "user@example.com", id: 123 };
      const masked = maskSensitiveData(data);
      expect(masked.userEmail).toBe("***@example.com");
    });

    it("should handle nested objects", () => {
      const data = {
        user: {
          email: "user@example.com",
          password: "secret",
        },
      };
      const masked = maskSensitiveData(data);
      expect((masked.user as Record<string, unknown>).email).toBe("***@example.com");
      expect((masked.user as Record<string, unknown>).password).toBe("[REDACTED]");
    });

    it("should handle null and undefined", () => {
      expect(maskSensitiveData(null as unknown as Record<string, unknown>)).toBe(null);
      expect(maskSensitiveData(undefined as unknown as Record<string, unknown>)).toBe(undefined);
    });
  });

  // logSecurityEvent: Integration tests
  describe("logSecurityEvent", () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should log INFO events to console.log", () => {
      const event: SecurityEvent = {
        type: "AUTH_SUCCESS",
        timestamp: new Date("2024-01-01T00:00:00Z"),
        ip: "192.168.1.1",
        userId: "testuser",
        details: {},
      };

      logSecurityEvent(event, "INFO");

      expect(consoleSpy).toHaveBeenCalled();
      const loggedMessage = consoleSpy.mock.calls[0][0];
      expect(loggedMessage).toContain("[SECURITY]");
      expect(loggedMessage).toContain("AUTH_SUCCESS");
    });

    it("should log WARN events to console.warn", () => {
      const warnSpy = vi.spyOn(console, "warn");
      const event: SecurityEvent = {
        type: "RATE_LIMIT",
        timestamp: new Date(),
        ip: "192.168.1.1",
        details: {},
      };

      logSecurityEvent(event, "WARN");
      expect(warnSpy).toHaveBeenCalled();
    });

    it("should log ERROR events to console.error", () => {
      const errorSpy = vi.spyOn(console, "error");
      const event: SecurityEvent = {
        type: "AUTH_FAILURE",
        timestamp: new Date(),
        ip: "192.168.1.1",
        details: { reason: "Invalid credentials" },
      };

      logSecurityEvent(event, "ERROR");
      expect(errorSpy).toHaveBeenCalled();
    });

    it("should mask sensitive data in details", () => {
      const event: SecurityEvent = {
        type: "AUTH_FAILURE",
        timestamp: new Date(),
        ip: "192.168.1.1",
        details: { password: "secret123", email: "user@example.com" },
      };

      logSecurityEvent(event);

      const loggedMessage = consoleSpy.mock.calls[0][0];
      expect(loggedMessage).not.toContain("secret123");
      expect(loggedMessage).toContain("[REDACTED]");
    });

    it("should mask userId in logs", () => {
      const event: SecurityEvent = {
        type: "AUTH_SUCCESS",
        timestamp: new Date(),
        ip: "192.168.1.1",
        userId: "johndoe",
        details: {},
      };

      logSecurityEvent(event);

      const loggedMessage = consoleSpy.mock.calls[0][0];
      expect(loggedMessage).not.toContain("johndoe");
      expect(loggedMessage).toContain("j***");
    });
  });

  // createSecureLogger: Integration tests
  describe("createSecureLogger", () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should create logger with context", () => {
      const logger = createSecureLogger("test-module");
      logger.info("Test message");

      const loggedMessage = consoleSpy.mock.calls[0][0];
      expect(loggedMessage).toContain("test-module");
      expect(loggedMessage).toContain("Test message");
    });

    it("should mask sensitive data in log messages", () => {
      const logger = createSecureLogger("auth");
      logger.info("Login attempt", { password: "secret", username: "john" });

      const loggedMessage = consoleSpy.mock.calls[0][0];
      expect(loggedMessage).not.toContain("secret");
      expect(loggedMessage).toContain("[REDACTED]");
    });

    it("should provide security method for security events", () => {
      const logger = createSecureLogger("auth");
      logger.security({
        type: "AUTH_SUCCESS",
        ip: "192.168.1.1",
        userId: "testuser",
        details: {},
      });

      const loggedMessage = consoleSpy.mock.calls[0][0];
      expect(loggedMessage).toContain("[SECURITY]");
      expect(loggedMessage).toContain("AUTH_SUCCESS");
    });
  });
});
