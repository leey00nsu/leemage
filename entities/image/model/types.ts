import { Image as PrismaImageType } from "@/lib/generated/prisma";

// ImageVariantData 타입 정의
export type ImageVariantData = {
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
  label: string;
};

// PrismaImageType에서 variants를 ImageVariantData[]로 오버라이드
export type ImageWithVariants = Omit<PrismaImageType, "variants"> & {
  variants: ImageVariantData[];
};
