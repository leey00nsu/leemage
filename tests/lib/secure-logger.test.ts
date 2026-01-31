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

describe("보안 로거", () => {
  describe("속성 8: API 키 마스킹 형식", () => {
    it("항상 접두사를 보존하고 나머지를 마스킹해야 한다", () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 10 })
            .filter((s) => /^[a-zA-Z0-9]+$/.test(s)),
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => !s.includes("_")),
          (prefix, secret) => {
            const apiKey = `${prefix}_${secret}`;
            const masked = maskApiKey(apiKey);
            expect(masked).toBe(`${prefix}_****`);
            if (secret.length > 4) {
              expect(masked).not.toContain(secret);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("키의 비밀 부분을 절대 노출하지 않아야 한다", () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 5, maxLength: 50 })
            .filter((s) => !s.includes("_") && /^[a-zA-Z0-9]+$/.test(s)),
          (secret) => {
            const apiKey = `lmk_${secret}`;
            const masked = maskApiKey(apiKey);
            expect(masked).not.toContain(secret);
            expect(masked).toBe("lmk_****");
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // maskApiKey: Edge cases not covered by Property 8
  describe("maskApiKey - 엣지 케이스", () => {
    it("밑줄이 없는 키를 처리해야 한다", () => {
      expect(maskApiKey("noseparator")).toBe("****");
    });

    it("빈 값 또는 유효하지 않은 입력을 처리해야 한다", () => {
      expect(maskApiKey("")).toBe("****");
      expect(maskApiKey(null as unknown as string)).toBe("****");
      expect(maskApiKey(undefined as unknown as string)).toBe("****");
    });
  });

  describe("속성 9: 이메일 마스킹 개인정보 보호", () => {
    it("이메일의 로컬 부분을 절대 노출하지 않아야 한다", () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 5, maxLength: 30 })
            .filter((s) => !s.includes("@") && /^[a-z]+$/.test(s)),
          fc
            .string({ minLength: 1, maxLength: 20 })
            .filter((s) => !s.includes("@") && /^[a-z]+$/.test(s)),
          (localPart, domain) => {
            if (domain.includes(localPart)) return;

            const email = `${localPart}@${domain}.com`;
            const masked = maskEmail(email);
            expect(masked).not.toContain(localPart);
            expect(masked).toContain(`@${domain}.com`);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("항상 마스킹 문자로 시작해야 한다", () => {
      fc.assert(
        fc.property(fc.emailAddress(), (email) => {
          const masked = maskEmail(email);
          expect(masked.startsWith("***")).toBe(true);
        }),
        { numRuns: 100 },
      );
    });
  });

  // maskEmail: Edge cases not covered by Property 9
  describe("maskEmail - 엣지 케이스", () => {
    it("유효하지 않은 이메일을 처리해야 한다", () => {
      expect(maskEmail("notanemail")).toBe("***");
      expect(maskEmail("")).toBe("***");
    });
  });

  // maskUsername: Not covered by property tests
  describe("사용자명 마스킹", () => {
    it("첫 글자만 표시해야 한다", () => {
      expect(maskUsername("johndoe")).toBe("j***");
      expect(maskUsername("admin")).toBe("a***");
    });

    it("빈 입력을 처리해야 한다", () => {
      expect(maskUsername("")).toBe("***");
      expect(maskUsername(null as unknown as string)).toBe("***");
    });
  });

  // maskSensitiveData: Integration tests
  describe("민감 데이터 마스킹", () => {
    it("비밀번호 필드를 마스킹해야 한다", () => {
      const data = { username: "john", password: "secret123" };
      const masked = maskSensitiveData(data);
      expect(masked.username).toBe("john");
      expect(masked.password).toBe("[REDACTED]");
    });

    it("API 키 필드를 마스킹해야 한다", () => {
      const data = { apiKey: "lmk_secret", name: "test" };
      const masked = maskSensitiveData(data);
      expect(masked.apiKey).toBe("[REDACTED]");
    });

    it("이메일 필드를 마스킹해야 한다", () => {
      const data = { userEmail: "user@example.com", id: 123 };
      const masked = maskSensitiveData(data);
      expect(masked.userEmail).toBe("***@example.com");
    });

    it("중첩 객체를 처리해야 한다", () => {
      const data = {
        user: {
          email: "user@example.com",
          password: "secret",
        },
      };
      const masked = maskSensitiveData(data);
      expect((masked.user as Record<string, unknown>).email).toBe(
        "***@example.com",
      );
      expect((masked.user as Record<string, unknown>).password).toBe(
        "[REDACTED]",
      );
    });

    it("null 및 undefined를 처리해야 한다", () => {
      expect(
        maskSensitiveData(null as unknown as Record<string, unknown>),
      ).toBe(null);
      expect(
        maskSensitiveData(undefined as unknown as Record<string, unknown>),
      ).toBe(undefined);
    });
  });

  // logSecurityEvent: Integration tests
  describe("보안 이벤트 로깅", () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("INFO 이벤트를 console.log에 로깅해야 한다", () => {
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

    it("WARN 이벤트를 console.warn에 로깅해야 한다", () => {
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

    it("ERROR 이벤트를 console.error에 로깅해야 한다", () => {
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

    it("세부 정보의 민감 데이터를 마스킹해야 한다", () => {
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

    it("로그에서 userId를 마스킹해야 한다", () => {
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
  describe("보안 로거 생성", () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("컨텍스트와 함께 로거를 생성해야 한다", () => {
      const logger = createSecureLogger("test-module");
      logger.info("Test message");

      const loggedMessage = consoleSpy.mock.calls[0][0];
      expect(loggedMessage).toContain("test-module");
      expect(loggedMessage).toContain("Test message");
    });

    it("로그 메시지의 민감 데이터를 마스킹해야 한다", () => {
      const logger = createSecureLogger("auth");
      logger.info("Login attempt", { password: "secret", username: "john" });

      const loggedMessage = consoleSpy.mock.calls[0][0];
      expect(loggedMessage).not.toContain("secret");
      expect(loggedMessage).toContain("[REDACTED]");
    });

    it("보안 이벤트를 위한 보안 메서드를 제공해야 한다", () => {
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
