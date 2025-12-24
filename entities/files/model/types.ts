import { File as PrismaFileType } from "@/lib/generated/prisma";

// 이미지 변환 버전 데이터 타입
export type ImageVariantData = {
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
  label: string;
};

// 파일 기본 데이터 타입 (Prisma File 모델 기반)
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

// PrismaFileType에서 variants를 ImageVariantData[]로 오버라이드
export type FileWithVariants = Omit<PrismaFileType, "variants"> & {
  variants: ImageVariantData[];
};
