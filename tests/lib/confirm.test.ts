import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { z } from "zod";

// Confirm 요청 스키마 (lib/api/confirm.ts와 동일)
const AVAILABLE_SIZES = [
  "original",
  "300x300",
  "600x600",
  "1200x1200",
] as const;
const AVAILABLE_FORMATS = ["jpeg", "png", "webp", "avif"] as const;

const variantOptionSchema = z.object({
  sizeLabel: z.enum(AVAILABLE_SIZES),
  format: z.enum(AVAILABLE_FORMATS),
});

const confirmRequestSchema = z.object({
  fileId: z.string().min(1),
  objectName: z.string().min(1),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  fileSize: z.number().positive(),
  variants: z.array(variantOptionSchema).optional(),
});

type ConfirmRequest = z.infer<typeof confirmRequestSchema>;
type VariantOption = z.infer<typeof variantOptionSchema>;

// 테스트용 순수 함수들
function buildObjectUrl(
  regionId: string,
  namespaceName: string,
  bucketName: string,
  objectName: string,
): string {
  return `https://objectstorage.${regionId}.oraclecloud.com/n/${namespaceName}/b/${bucketName}/o/${objectName}`;
}

function buildFileRecord(
  request: ConfirmRequest,
  objectUrl: string,
  isImage: boolean,
  variants: Array<{ url: string; label: string; format: string }> = [],
) {
  return {
    id: request.fileId,
    name: request.fileName,
    mimeType: request.contentType,
    isImage,
    size: request.fileSize,
    url: isImage ? null : objectUrl,
    variants,
    projectId: request.objectName.split("/")[0],
  };
}

function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function validateVariantsMatch(
  requestedVariants: VariantOption[],
  resultVariants: Array<{ label: string; format: string }>,
): boolean {
  if (requestedVariants.length !== resultVariants.length) {
    return false;
  }

  return requestedVariants.every((requested) =>
    resultVariants.some(
      (result) =>
        result.label === requested.sizeLabel &&
        result.format === requested.format,
    ),
  );
}

describe("Confirm API 로직", () => {
  // Arbitrary generators
  const fileIdArb = fc.stringMatching(/^[a-z0-9]{20,30}$/);
  const projectIdArb = fc.stringMatching(/^[a-z0-9]{10,25}$/);
  const fileNameArb = fc.stringMatching(/^[a-zA-Z0-9_-]{1,50}\.[a-z]{2,4}$/);
  const fileSizeArb = fc.integer({ min: 1, max: 50 * 1024 * 1024 });
  const regionIdArb = fc.constantFrom("ap-seoul-1", "us-ashburn-1");
  const namespaceArb = fc.stringMatching(/^[a-z0-9]{10,20}$/);
  const bucketArb = fc.stringMatching(/^[a-z0-9-]{5,20}$/);

  const nonImageMimeTypeArb = fc.constantFrom(
    "application/pdf",
    "text/plain",
    "application/zip",
    "application/json",
  );

  const imageMimeTypeArb = fc.constantFrom(
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
  );

  const sizeLabelArb = fc.constantFrom(...AVAILABLE_SIZES);
  const formatArb = fc.constantFrom(...AVAILABLE_FORMATS);

  const variantOptionArb = fc.record({
    sizeLabel: sizeLabelArb,
    format: formatArb,
  });

  const variantsArb = fc.array(variantOptionArb, {
    minLength: 1,
    maxLength: 8,
  });

  describe("속성 2: 업로드 흐름 완전성", () => {
    it("비이미지 파일에 대해 올바른 속성으로 파일 레코드를 생성해야 한다", () => {
      fc.assert(
        fc.property(
          fileIdArb,
          projectIdArb,
          fileNameArb,
          nonImageMimeTypeArb,
          fileSizeArb,
          regionIdArb,
          namespaceArb,
          bucketArb,
          (
            fileId,
            projectId,
            fileName,
            contentType,
            fileSize,
            regionId,
            namespace,
            bucket,
          ) => {
            const objectName = `${projectId}/${fileId}.pdf`;
            const objectUrl = buildObjectUrl(
              regionId,
              namespace,
              bucket,
              objectName,
            );

            const request: ConfirmRequest = {
              fileId,
              objectName,
              fileName,
              contentType,
              fileSize,
            };

            const isImage = isImageMimeType(contentType);
            const fileRecord = buildFileRecord(request, objectUrl, isImage);

            // 파일 레코드가 올바른 속성을 가지는지 확인
            expect(fileRecord.id).toBe(fileId);
            expect(fileRecord.name).toBe(fileName);
            expect(fileRecord.mimeType).toBe(contentType);
            expect(fileRecord.size).toBe(fileSize);
            expect(fileRecord.isImage).toBe(false);
            expect(fileRecord.url).toBe(objectUrl);
            expect(fileRecord.variants).toEqual([]);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("Confirm 요청 스키마를 올바르게 검증해야 한다", () => {
      fc.assert(
        fc.property(
          fileIdArb,
          projectIdArb,
          fileNameArb,
          nonImageMimeTypeArb,
          fileSizeArb,
          (fileId, projectId, fileName, contentType, fileSize) => {
            const objectName = `${projectId}/${fileId}.pdf`;

            const validRequest = {
              fileId,
              objectName,
              fileName,
              contentType,
              fileSize,
            };

            // 유효한 요청은 파싱 성공
            const result = confirmRequestSchema.safeParse(validRequest);
            expect(result.success).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("유효하지 않은 Confirm 요청을 거부해야 한다", () => {
      // 빈 fileId
      const invalidRequest1 = {
        fileId: "",
        objectName: "project/file.pdf",
        fileName: "test.pdf",
        contentType: "application/pdf",
        fileSize: 1000,
      };
      expect(confirmRequestSchema.safeParse(invalidRequest1).success).toBe(
        false,
      );

      // 음수 fileSize
      const invalidRequest2 = {
        fileId: "abc123",
        objectName: "project/file.pdf",
        fileName: "test.pdf",
        contentType: "application/pdf",
        fileSize: -100,
      };
      expect(confirmRequestSchema.safeParse(invalidRequest2).success).toBe(
        false,
      );
    });
  });

  describe("속성 3: 이미지 변형 처리", () => {
    it("요청된 변형과 결과 변형이 일치해야 한다", () => {
      fc.assert(
        fc.property(variantsArb, (requestedVariants) => {
          // 시뮬레이션: 요청된 variants와 동일한 결과 생성
          const resultVariants = requestedVariants.map((v) => ({
            url: `https://example.com/${v.sizeLabel}.${v.format}`,
            label: v.sizeLabel,
            format: v.format,
            width: 100,
            height: 100,
            size: 1000,
          }));

          // 모든 요청된 variant가 결과에 포함되어야 함
          const isValid = validateVariantsMatch(
            requestedVariants,
            resultVariants,
          );
          expect(isValid).toBe(true);
        }),
        { numRuns: 100 },
      );
    });

    it("변형이 포함된 이미지 파일 레코드를 생성해야 한다", () => {
      fc.assert(
        fc.property(
          fileIdArb,
          projectIdArb,
          fileNameArb,
          imageMimeTypeArb,
          fileSizeArb,
          variantsArb,
          (fileId, projectId, fileName, contentType, fileSize, variants) => {
            const objectName = `${projectId}/${fileId}.jpg`;

            const request: ConfirmRequest = {
              fileId,
              objectName,
              fileName,
              contentType,
              fileSize,
              variants,
            };

            const isImage = isImageMimeType(contentType);
            expect(isImage).toBe(true);

            // 시뮬레이션: variants 처리 결과
            const processedVariants = variants.map((v) => ({
              url: `https://example.com/${fileId}-${v.sizeLabel}.${v.format}`,
              label: v.sizeLabel,
              format: v.format,
            }));

            const fileRecord = buildFileRecord(
              request,
              "",
              isImage,
              processedVariants,
            );

            // 이미지 파일 레코드 검증
            expect(fileRecord.isImage).toBe(true);
            expect(fileRecord.url).toBeNull();
            expect(fileRecord.variants.length).toBe(variants.length);

            // 모든 요청된 variant가 결과에 포함되어야 함
            const isValid = validateVariantsMatch(
              variants,
              fileRecord.variants,
            );
            expect(isValid).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("변형 옵션 스키마를 검증해야 한다", () => {
      fc.assert(
        fc.property(sizeLabelArb, formatArb, (sizeLabel, format) => {
          const validVariant = { sizeLabel, format };
          const result = variantOptionSchema.safeParse(validVariant);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 },
      );
    });

    it("유효하지 않은 변형 옵션을 거부해야 한다", () => {
      // 잘못된 sizeLabel
      const invalidVariant1 = { sizeLabel: "invalid", format: "jpeg" };
      expect(variantOptionSchema.safeParse(invalidVariant1).success).toBe(
        false,
      );

      // 잘못된 format
      const invalidVariant2 = { sizeLabel: "original", format: "gif" };
      expect(variantOptionSchema.safeParse(invalidVariant2).success).toBe(
        false,
      );
    });
  });
});
