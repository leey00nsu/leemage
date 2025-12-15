import { Image as PrismaImageType } from "@/lib/generated/prisma";

// 이미지 변환 버전 데이터 타입
export type ImageVariantData = {
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
  label: string;
};

// 파일 기본 데이터 타입 (Prisma Image 모델 기반)
export type FileData = {
  id: string;
  projectId: string;
  name: string;
  mimeType: string;
  isImage: boolean;
  size: number;
  url: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// PrismaImageType에서 variants를 ImageVariantData[]로 오버라이드
export type FileWithVariants = Omit<PrismaImageType, "variants"> & {
  variants: ImageVariantData[];
};

// 이전 타입명과의 호환성을 위한 별칭
export type ImageWithVariants = FileWithVariants;
