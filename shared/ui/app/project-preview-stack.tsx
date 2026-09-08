"use client";

import { useState } from "react";
import {
  FileText,
  FileImage,
  FileVideo,
  Music,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { ProjectPreviewFile } from "@/shared/lib/project-preview";

function Preview({ file }: { file: ProjectPreviewFile }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const Icon = file.mimeType.startsWith("video/")
    ? FileVideo
    : file.mimeType.startsWith("audio/")
      ? Music
      : file.mimeType.startsWith("image/")
        ? FileImage
        : FileText;
  return (
    <>
      <Icon className="size-7 text-muted-foreground/70" />
      {file.thumbnailUrl && failedUrl !== file.thumbnailUrl && (
        // Storage URLs already point to generated previews; no image proxy needed.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={file.thumbnailUrl}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="absolute inset-0 size-full object-cover"
          onError={() => setFailedUrl(file.thumbnailUrl)}
        />
      )}
    </>
  );
}

export function ProjectPreviewStack({
  files = [],
  compact = false,
}: {
  files?: ProjectPreviewFile[];
  compact?: boolean;
}) {
  const recent = files.slice(0, 3);
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative flex size-full items-center justify-center"
    >
      {recent.length === 0 ? (
        <FolderOpen
          className={cn(
            "text-muted-foreground/50",
            compact ? "size-8" : "size-12",
          )}
        />
      ) : (
        <div
          className={cn("relative", compact ? "h-14 w-14" : "h-[62%] w-[66%]")}
        >
          {recent.map((file, index) => (
            <div
              key={file.id}
              className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-lg border-[3px] border-background bg-muted shadow-md"
              style={{
                zIndex: 3 - index,
                transform:
                  index === 0
                    ? "rotate(-3deg)"
                    : index === 1
                      ? "translate(8%, -7%) rotate(6deg)"
                      : "translate(-7%, -13%) rotate(-10deg)",
              }}
            >
              <Preview file={file} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
