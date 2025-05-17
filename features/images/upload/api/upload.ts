import { Image as PrismaImage } from "@/lib/generated/prisma";

// ImageVariantData 타입 정의 (공유 타입으로 분리 권장)
type ImageVariantData = {
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
};

// API 응답 타입 (variants 포함)
export type ApiImageResponse = Omit<PrismaImage, "variants"> & {
  variants: ImageVariantData[];
};

interface UploadParams {
  projectId: string;
  formData: FormData;
}

export const uploadImage = async ({
  projectId,
  formData,
}: UploadParams): Promise<ApiImageResponse> => {
  // 이제 projectId 사용 가능
  const response = await fetch(`/api/projects/${projectId}/images`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "이미지 업로드에 실패했습니다.");
  }

  const data = await response.json();
  return data as ApiImageResponse;
};
