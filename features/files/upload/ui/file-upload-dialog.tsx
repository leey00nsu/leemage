"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { usePresignedUpload } from "../model/presigned-upload";
import { FileInput } from "@/entities/files/ui/file-input";
import { TransformOptions } from "@/entities/files/ui/image/transform-options";
import {
  isImageFile,
  createFileSizeSchema,
  DEFAULT_MAX_FILE_SIZE,
} from "@/shared/lib/file-utils";
import {
  planImageTransforms,
  type ImageTransformRequest,
} from "@/shared/lib/image-transform-plan";
import { Progress } from "@/shared/ui/progress";

export function FileUploadDialog({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("FileUploadDialog");
  const o = useTranslations("UploadOptions");
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [variants, setVariants] = useState<ImageTransformRequest[]>([]);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const isImage = file ? isImageFile(file) : false;
  const { status, progress, error, upload, cancel, reset, isUploading } =
    usePresignedUpload({
      projectId,
      onSuccess: () => {
        toast.success(t("uploadSuccess", { fileName: file?.name || "" }));
        setOpen(false);
        clear();
      },
      onError: (e) => toast.error(e.message),
    });
  function clear() {
    setFile(null);
    setVariants([]);
    setDimensions(null);
    reset();
  }
  const plan = useMemo(() => {
    if (!isImage || !file || !dimensions)
      return { outputs: null, invalid: false };
    try {
      return {
        outputs: planImageTransforms(
          dimensions.width,
          dimensions.height,
          file.type.split("/")[1],
          variants,
        ),
        invalid: false,
      };
    } catch {
      return { outputs: null, invalid: true };
    }
  }, [isImage, file, dimensions, variants]);
  const fileValid =
    !!file &&
    createFileSizeSchema(DEFAULT_MAX_FILE_SIZE).safeParse(file).success;
  const invalid =
    !fileValid ||
    plan.invalid ||
    (isImage && variants.length > 0 && !dimensions);
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (isUploading) return;
        setOpen(value);
        if (!value) clear();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        showCloseButton={!isUploading}
        className="flex max-h-[min(760px,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <DialogHeader className="shrink-0 border-b px-6 py-5 pr-12">
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <form
          className="flex min-h-0 flex-auto flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            if (file && !invalid && !isUploading)
              upload(
                file,
                isImage ? variants : undefined,
                isImage ? dimensions : undefined,
              );
          }}
        >
          <div
            data-slot="upload-scroll-area"
            className="min-h-0 flex-auto space-y-5 overflow-y-auto overscroll-contain px-6 py-5"
          >
            <FileInput
              selectedFile={file}
              onChange={(value) => {
                setFile(value);
                setDimensions(null);
              }}
              disabled={isUploading}
              id="file-input"
              label={t("fileInputLabel")}
              accept="*/*"
              onDimensionsLoad={setDimensions}
            />
            {file && !fileValid && (
              <p role="alert" className="text-sm text-destructive">
                {o("fileLimit")}
              </p>
            )}
            {isImage && (
              <>
                <p className="rounded-lg bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  {o("includedSummary")}
                </p>
                <TransformOptions
                  variants={variants}
                  onChange={setVariants}
                  disabled={isUploading}
                />
                {plan.invalid && (
                  <p role="alert" className="text-sm text-destructive">
                    {o("invalid")}
                  </p>
                )}
                {!dimensions && (
                  <p className="text-xs text-muted-foreground">
                    {o("dimensionsUnknown")}
                  </p>
                )}
                <section
                  className="rounded-lg border p-4 space-y-2"
                  aria-live="polite"
                >
                  <h3 className="font-medium">{o("planned")}</h3>
                  <p className="text-sm">{o("original")}</p>
                  {plan.outputs ? (
                    <>
                      <ul className="space-y-1 text-sm">
                        {plan.outputs.map((output) => (
                          <li key={output.key}>
                            {output.thumbnail
                              ? o("thumbnailName")
                              : o("output")}{" "}
                            · {output.width}×{output.height} ·{" "}
                            {output.format.toUpperCase()}
                            {output.fit === "cover" ? ` · ${o("cover")}` : ""}
                          </li>
                        ))}
                      </ul>
                      <p className="font-medium text-sm">
                        {o("count", { count: 1 + plan.outputs.length })}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {o("pendingPlan")}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {o("dedupHint")}
                  </p>
                </section>
              </>
            )}
            {file && !isImage && (
              <p className="text-sm text-muted-foreground">
                {t("nonImageFileInfo")}
              </p>
            )}
            {status !== "idle" && (
              <div role="status" className="space-y-2">
                <p className={error ? "text-sm text-destructive" : "text-sm"}>
                  {error || o(`status.${status}`)}
                </p>
                {isUploading && <Progress value={progress} />}
              </div>
            )}
          </div>
          <DialogFooter className="shrink-0 border-t bg-background px-6 py-4">
            {isUploading ? (
              <Button type="button" variant="destructive" onClick={cancel}>
                {t("cancelButton")}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    clear();
                  }}
                >
                  {t("cancelButton")}
                </Button>
                <Button type="submit" disabled={invalid}>
                  {t("uploadButton")}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
