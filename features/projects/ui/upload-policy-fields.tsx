"use client";
import { useTranslations } from "next-intl";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { DEFAULT_UPLOAD_BYTES, MIB } from "@/shared/lib/upload-policy";
import { useUploadPolicy } from "../model/upload-policy";

export function UploadPolicyFields({
  maxUploadBytes,
  videoThumbnailEnabled,
  onLimitChange,
  onThumbnailChange,
  disabled,
}: {
  maxUploadBytes?: number;
  videoThumbnailEnabled?: boolean;
  onLimitChange: (value: number) => void;
  onThumbnailChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("UploadPolicy");
  const { data } = useUploadPolicy();
  return (
    <fieldset disabled={disabled} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="max-upload-mib">{t("limitLabel")}</Label>
        <Input
          id="max-upload-mib"
          type="number"
          min={1}
          max={data ? data.serverMaxUploadBytes / MIB : undefined}
          step={1}
          required
          value={(maxUploadBytes ?? DEFAULT_UPLOAD_BYTES) / MIB || ""}
          onChange={(event) => onLimitChange(Number(event.target.value) * MIB)}
        />
        <p className="text-xs text-muted-foreground">
          {data
            ? t("limitHelp", { limit: data.serverMaxUploadBytes / MIB })
            : t("limitLoading")}
        </p>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="video-thumbnail">{t("thumbnailLabel")}</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("thumbnailHelp")}
          </p>
        </div>
        <Switch
          id="video-thumbnail"
          checked={videoThumbnailEnabled ?? true}
          onCheckedChange={onThumbnailChange}
          disabled={disabled}
        />
      </div>
    </fieldset>
  );
}
