import { Image } from "@/lib/generated/prisma";

interface UploadImageParams {
  projectId: string;
  file: File;
}

export const uploadImageFn = async ({
  projectId,
  file,
}: UploadImageParams): Promise<Image> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/api/projects/${projectId}/images`, {
    method: "POST",
    body: formData, // FormData를 직접 body에 전달
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "이미지 업로드에 실패했습니다.");
  }

  return response.json();
};
