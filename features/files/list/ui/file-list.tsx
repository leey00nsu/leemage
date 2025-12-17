"use client";

import { ImageVariantData } from "@/entities/files/model/types";
import { EmptyFileState } from "@/entities/files/ui/empty-file-state";
import { ImageCard } from "@/entities/files/ui/image/image-card";
import { FileGrid } from "@/entities/files/ui/file-grid";
import { Image as PrismaImageType } from "@/lib/generated/prisma";
import { useTranslations } from "next-intl";

type FileWithVariants = Omit<PrismaImageType, "variants"> & {
  variants: ImageVariantData[];
};

interface FileListProps {
  files: FileWithVariants[];
}

export function FileList({ files }: FileListProps) {
  const t = useTranslations("ImageList");
  if (!files || files.length === 0) {
    return <EmptyFileState message={t("noImagesInProject")} />;
  }

  return (
    <FileGrid>
      {files.map((file, index) => (
        <ImageCard
          key={file.id}
          id={file.id}
          projectId={file.projectId}
          name={file.name}
          variants={file.variants}
          priority={index < 6}
          isImage={file.isImage}
          mimeType={file.mimeType}
          size={file.size}
        />
      ))}
    </FileGrid>
  );
}
