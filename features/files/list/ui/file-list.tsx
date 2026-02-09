"use client";

import { ImageVariantData } from "@/entities/files/model/types";
import { EmptyFileState } from "@/entities/files/ui/empty-file-state";
import { AssetCard } from "@/entities/files/ui/asset-card";
import { FileGrid } from "@/entities/files/ui/file-grid";
import { File as PrismaFileType } from "@/lib/generated/prisma";
import { useTranslations } from "next-intl";

type FileWithVariants = Omit<PrismaFileType, "variants"> & {
  variants: ImageVariantData[];
};

interface FileListProps {
  files: FileWithVariants[];
}

export function FileList({ files }: FileListProps) {
  const t = useTranslations("FileList");
  if (!files || files.length === 0) {
    return <EmptyFileState message={t("noFilesInProject")} />;
  }

  return (
    <FileGrid>
      {files.map((file, index) => (
        <AssetCard
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
