import { Image as PrismaImage } from "@/lib/generated/prisma";
import { ImageVariantData } from "@/entities/files";

// API 응답 타입 (variants 포함)
export type ApiFileResponse = Omit<PrismaImage, "variants"> & {
  variants: ImageVariantData[];
};

interface UploadParams {
  projectId: string;
  formData: FormData;
}

export const uploadFile = async ({
  projectId,
  formData,
}: UploadParams): Promise<ApiFileResponse> => {
  const response = await fetch(`/api/projects/${projectId}/files`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "파일 업로드에 실패했습니다.");
  }

  const data = await response.json();
  return data as ApiFileResponse;
};

// 이전 함수명과의 호환성을 위한 별칭
export const uploadImage = uploadFile;
