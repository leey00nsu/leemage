"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { ImageIcon } from "lucide-react";
import { findSourceVariant } from "@/shared/lib/image-utils";
import { FileWithVariants } from "@/entities/files/model/types";
import { FileTypeIcon } from "@/entities/files/ui/file-type-icon";
import { FileInfo } from "@/entities/files/ui/file-info";
import { FileActions } from "@/entities/files/ui/file-actions";
import { ImagePreview } from "@/entities/files/ui/image/image-preview";
import { ImageInfo } from "@/entities/files/ui/image/image-info";
import { ImageVariantList } from "@/entities/files/ui/image/image-variant-list";
import { VideoPreview, getVideoPreviewProps } from "@/entities/files/ui/video/video-preview";
import { DeleteFileDialog } from "@/features/files/delete/ui/delete-file-dialog";
import { useTranslations } from "next-intl";
import { isVideoMimeType } from "@/shared/lib/file-utils";

interface FileDetailWidgetProps {
  file: FileWithVariants;
}

export function FileDetailWidget({ file }: FileDetailWidgetProps) {
  const t = useTranslations("ImageDetailsWidget");

  // variants가 비어있으면 비이미지로 처리 (기존 데이터 호환)
  const hasVariants = file.variants && file.variants.length > 0;
  const effectiveIsImage = file.isImage && hasVariants;
  const isVideo = isVideoMimeType(file.mimeType);

  // 비디오 파일인 경우
  if (isVideo) {
    const videoPreviewProps = getVideoPreviewProps(
      file.variants,
      file.url || "",
      file.name
    );
    // 원본 비디오 정보 (해상도 포함)
    const sourceVariant = findSourceVariant(file.variants || []);

    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="truncate" title={file.name}>
                {file.name}
              </CardTitle>
              <Badge variant="secondary" className="w-fit mt-1">
                {file.mimeType}
              </Badge>
            </div>
            <DeleteFileDialog file={file} />
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* 비디오 미리보기 */}
              <VideoPreview {...videoPreviewProps} />

              {/* 파일 정보 */}
              <div className="space-y-4">
                <FileInfo
                  name={file.name}
                  size={file.size}
                  mimeType={file.mimeType}
                  createdAt={file.createdAt}
                  updatedAt={file.updatedAt}
                  url={file.url}
                  resolution={sourceVariant ? { width: sourceVariant.width, height: sourceVariant.height } : undefined}
                />

                {/* 다운로드/열기 버튼 */}
                {file.url && (
                  <FileActions
                    projectId={file.projectId}
                    fileId={file.id}
                    url={file.url}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 비이미지 파일인 경우
  if (!effectiveIsImage) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="truncate" title={file.name}>
                {file.name}
              </CardTitle>
              <Badge variant="secondary" className="w-fit mt-1">
                {file.mimeType}
              </Badge>
            </div>
            <DeleteFileDialog file={file} />
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* 파일 아이콘 표시 */}
              <div className="flex items-center justify-center bg-muted/30 rounded-lg p-12">
                <FileTypeIcon mimeType={file.mimeType} size={120} />
              </div>

              {/* 파일 정보 */}
              <div className="space-y-4">
                <FileInfo
                  name={file.name}
                  size={file.size}
                  mimeType={file.mimeType}
                  createdAt={file.createdAt}
                  updatedAt={file.updatedAt}
                  url={file.url}
                />

                {/* 다운로드/열기 버튼 */}
                {file.url && (
                  <FileActions
                    projectId={file.projectId}
                    fileId={file.id}
                    url={file.url}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 이미지 파일인 경우 - 원본(source)을 기본 표시
  const displayVariant =
    findSourceVariant(file.variants) ||
    file.variants[0];

  if (!displayVariant) {
    return (
      <Card className="container mx-auto py-8 px-4">
        <CardHeader>
          <CardTitle>{t("noInfoTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t("noInfoDescription")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="truncate" title={file.name}>
              {file.name}
            </CardTitle>
            <Badge variant="secondary" className="w-fit mt-1">
              {displayVariant.format.toUpperCase()}
            </Badge>
          </div>
          <DeleteFileDialog file={file} />
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <ImagePreview variant={displayVariant} altText={file.name} />
            <div className="space-y-4">
              <ImageInfo image={file} displayVariant={displayVariant} />
              <ImageVariantList
                variants={file.variants}
                displayVariantLabel={displayVariant.label}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
