import { File as PrismaFile } from "@/lib/generated/prisma";
import { ImageVariantData } from "@/entities/files/model/types";

// Presign API 응답 타입
export interface PresignResponse {
  presignedUrl: string;
  objectName: string;
  objectUrl: string;
  fileId: string;
  expiresAt: string;
}

// Confirm API 응답 타입
export interface ConfirmResponse {
  message: string;
  file: Omit<PrismaFile, "variants"> & { variants: ImageVariantData[] };
  variants?: ImageVariantData[];
}

// Variant 옵션 타입
export interface VariantOption {
  sizeLabel: string;
  format: string;
}

// Presigned Upload 옵션
export interface PresignedUploadOptions {
  projectId: string;
  file: File;
  variants?: VariantOption[];
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

/**
 * Presigned URL 요청
 */
export async function requestPresignedUrl(
  projectId: string,
  fileName: string,
  contentType: string,
  fileSize: number
): Promise<PresignResponse> {
  const response = await fetch(`/api/projects/${projectId}/files/presign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName,
      contentType,
      fileSize,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Presigned URL 요청에 실패했습니다.");
  }

  return response.json();
}

/**
 * OCI에 직접 파일 업로드 (XMLHttpRequest 사용하여 진행률 지원)
 */
export function uploadToOCI(
  presignedUrl: string,
  file: File,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // 진행률 이벤트
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    // 완료 이벤트
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`OCI 업로드 실패: ${xhr.status} ${xhr.statusText}`));
      }
    });

    // 에러 이벤트
    xhr.addEventListener("error", () => {
      reject(new Error("네트워크 오류가 발생했습니다."));
    });

    // 타임아웃 이벤트
    xhr.addEventListener("timeout", () => {
      reject(new Error("업로드 시간이 초과되었습니다."));
    });

    // 취소 처리
    if (signal) {
      signal.addEventListener("abort", () => {
        xhr.abort();
        reject(new Error("업로드가 취소되었습니다."));
      });
    }

    // 요청 설정 및 전송
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}

/**
 * 업로드 완료 확인 요청
 */
export async function confirmUpload(
  projectId: string,
  fileId: string,
  objectName: string,
  fileName: string,
  contentType: string,
  fileSize: number,
  variants?: VariantOption[]
): Promise<ConfirmResponse> {
  const response = await fetch(`/api/projects/${projectId}/files/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileId,
      objectName,
      fileName,
      contentType,
      fileSize,
      variants,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "업로드 확인에 실패했습니다.");
  }

  return response.json();
}

/**
 * Presigned URL을 사용한 전체 업로드 플로우
 */
export async function uploadFileWithPresignedUrl(
  options: PresignedUploadOptions
): Promise<ConfirmResponse> {
  const { projectId, file, variants, onProgress, signal } = options;

  // 1. Presigned URL 요청
  const presignResponse = await requestPresignedUrl(
    projectId,
    file.name,
    file.type,
    file.size
  );

  // 2. OCI에 직접 업로드
  await uploadToOCI(presignResponse.presignedUrl, file, onProgress, signal);

  // 3. 업로드 완료 확인
  const confirmResponse = await confirmUpload(
    projectId,
    presignResponse.fileId,
    presignResponse.objectName,
    file.name,
    file.type,
    file.size,
    variants
  );

  return confirmResponse;
}
