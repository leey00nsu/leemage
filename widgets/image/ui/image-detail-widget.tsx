"use client";

// 새 구조로 리다이렉트 - 호환성을 위해 유지
import { FileWithVariants } from "@/entities/files";
import { FileDetailWidget } from "@/widgets/file/ui/file-detail-widget";

// 이전 타입명과의 호환성을 위한 별칭
type ImageWithVariants = FileWithVariants;

export function ImageDetailsWidget({ image }: { image: ImageWithVariants }) {
  return <FileDetailWidget file={image} />;
}
