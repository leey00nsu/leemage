"use client";
import { useTranslations } from "next-intl";
export function VideoProcessingStatus({ status }: { status?: string }) {
  const t = useTranslations("VideoProcessing");
  if (status !== "QUEUED" && status !== "RUNNING" && status !== "FAILED")
    return null;
  return (
    <p
      role="status"
      className={`text-xs ${status === "FAILED" ? "text-destructive" : "text-muted-foreground"}`}
    >
      {t(status)}
    </p>
  );
}
