import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Mock OCI 클라이언트 응답 타입
interface MockPARResponse {
  preauthenticatedRequest: {
    accessUri: string;
    name: string;
    objectName: string;
    timeExpires: Date;
  };
}

// PAR 생성 로직을 테스트하기 위한 순수 함수 추출
interface CreatePAROptions {
  objectName: string;
  contentType: string;
  expiresInMinutes?: number;
}

interface PARResult {
  presignedUrl: string;
  objectUrl: string;
  expiresAt: Date;
}

// PAR 결과 생성 로직 (OCI 호출 없이 테스트 가능한 순수 함수)
function buildPARResult(
  accessUri: string,
  objectName: string,
  expiresAt: Date,
  regionId: string,
  namespaceName: string,
  bucketName: string,
): PARResult {
  const presignedUrl = `https://objectstorage.${regionId}.oraclecloud.com${accessUri}`;
  const objectUrl = `https://objectstorage.${regionId}.oraclecloud.com/n/${namespaceName}/b/${bucketName}/o/${objectName}`;

  return {
    presignedUrl,
    objectUrl,
    expiresAt,
  };
}

// 만료 시간 계산 로직
function calculateExpiresAt(expiresInMinutes: number = 15): Date {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);
  return expiresAt;
}

// objectName 생성 로직
function buildObjectName(
  projectId: string,
  fileId: string,
  extension: string,
): string {
  return `${projectId}/${fileId}.${extension}`;
}

describe("Presigned URL 생성", () => {
  // Arbitrary generators
  const projectIdArb = fc.stringMatching(/^[a-z0-9]{10,25}$/);
  const fileIdArb = fc.stringMatching(/^[a-z0-9]{20,30}$/);
  const extensionArb = fc.constantFrom(
    "jpg",
    "png",
    "webp",
    "pdf",
    "txt",
    "zip",
  );
  const regionIdArb = fc.constantFrom(
    "ap-seoul-1",
    "us-ashburn-1",
    "eu-frankfurt-1",
  );
  const namespaceArb = fc.stringMatching(/^[a-z0-9]{10,20}$/);
  const bucketArb = fc.stringMatching(/^[a-z0-9-]{5,20}$/);
  const expiresInMinutesArb = fc.integer({ min: 1, max: 60 });

  describe("속성 1: Presigned URL 생성 유효성", () => {
    it("유효한 Presigned URL 형식을 생성해야 한다", () => {
      fc.assert(
        fc.property(
          projectIdArb,
          fileIdArb,
          extensionArb,
          regionIdArb,
          namespaceArb,
          bucketArb,
          (projectId, fileId, extension, regionId, namespace, bucket) => {
            const objectName = buildObjectName(projectId, fileId, extension);
            const accessUri = `/p/mock-par-id/n/${namespace}/b/${bucket}/o/${objectName}`;
            const expiresAt = calculateExpiresAt(15);

            const result = buildPARResult(
              accessUri,
              objectName,
              expiresAt,
              regionId,
              namespace,
              bucket,
            );

            // presignedUrl이 유효한 URL 형식인지 확인
            expect(() => new URL(result.presignedUrl)).not.toThrow();
            expect(result.presignedUrl).toContain("https://objectstorage.");
            expect(result.presignedUrl).toContain(".oraclecloud.com");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("objectName에 projectId와 fileId가 포함되어야 한다", () => {
      fc.assert(
        fc.property(
          projectIdArb,
          fileIdArb,
          extensionArb,
          (projectId, fileId, extension) => {
            const objectName = buildObjectName(projectId, fileId, extension);

            // objectName이 projectId와 fileId를 포함하는지 확인
            expect(objectName).toContain(projectId);
            expect(objectName).toContain(fileId);
            expect(objectName).toBe(`${projectId}/${fileId}.${extension}`);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("만료 시간을 약 15분 후로 설정해야 한다", () => {
      fc.assert(
        fc.property(expiresInMinutesArb, (expiresInMinutes) => {
          const before = new Date();
          const expiresAt = calculateExpiresAt(expiresInMinutes);
          const after = new Date();

          // 만료 시간이 현재 시간 + expiresInMinutes 범위 내에 있는지 확인
          const expectedMinTime = new Date(
            before.getTime() + expiresInMinutes * 60 * 1000,
          );
          const expectedMaxTime = new Date(
            after.getTime() + expiresInMinutes * 60 * 1000 + 1000,
          ); // 1초 여유

          expect(expiresAt.getTime()).toBeGreaterThanOrEqual(
            expectedMinTime.getTime() - 1000,
          );
          expect(expiresAt.getTime()).toBeLessThanOrEqual(
            expectedMaxTime.getTime(),
          );
        }),
        { numRuns: 100 },
      );
    });

    it("명시되지 않은 경우 기본값이 15분으로 만료되어야 한다", () => {
      const before = new Date();
      const expiresAt = calculateExpiresAt(); // default 15 minutes
      const after = new Date();

      const expectedMinTime = new Date(before.getTime() + 15 * 60 * 1000);
      const expectedMaxTime = new Date(after.getTime() + 15 * 60 * 1000 + 1000);

      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(
        expectedMinTime.getTime() - 1000,
      );
      expect(expiresAt.getTime()).toBeLessThanOrEqual(
        expectedMaxTime.getTime(),
      );
    });

    it("올바른 형식의 objectUrl을 생성해야 한다", () => {
      fc.assert(
        fc.property(
          projectIdArb,
          fileIdArb,
          extensionArb,
          regionIdArb,
          namespaceArb,
          bucketArb,
          (projectId, fileId, extension, regionId, namespace, bucket) => {
            const objectName = buildObjectName(projectId, fileId, extension);
            const accessUri = `/p/mock-par-id/n/${namespace}/b/${bucket}/o/${objectName}`;
            const expiresAt = calculateExpiresAt(15);

            const result = buildPARResult(
              accessUri,
              objectName,
              expiresAt,
              regionId,
              namespace,
              bucket,
            );

            // objectUrl이 올바른 형식인지 확인
            expect(() => new URL(result.objectUrl)).not.toThrow();
            expect(result.objectUrl).toBe(
              `https://objectstorage.${regionId}.oraclecloud.com/n/${namespace}/b/${bucket}/o/${objectName}`,
            );
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
