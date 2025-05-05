import {
  Project as PrismaProject,
  Image as PrismaImage,
} from "@/lib/generated/prisma";

// ImageVariantData 타입 정의 (공유 타입으로 분리 권장)
type ImageVariantData = {
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
  label: string;
};

type ImageWithVariants = Omit<PrismaImage, "variants"> & {
  variants: ImageVariantData[];
};

// API 응답 및 useQuery 반환 타입 정의
export type ProjectDetailsApiResponse = Omit<PrismaProject, "images"> & {
  images: ImageWithVariants[];
};

export const getProjectDetailsFn = async (
  projectId: string
): Promise<ProjectDetailsApiResponse> => {
  const response = await fetch(`/api/projects/${projectId}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "프로젝트 정보 조회에 실패했습니다.");
  }

  // API는 이미 variants를 포함하고 적절한 타입으로 반환한다고 가정 (API 수정 완료됨)
  // 필요 시 여기서 추가적인 타입 검증/변환 수행 가능
  const data = await response.json();
  return data as ProjectDetailsApiResponse; // API 응답을 정의된 타입으로 단언
};
