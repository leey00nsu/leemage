import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { formatBytes } from "@/shared/lib/format-bytes";

import type { LogEntry } from "../model/types";
import { formatEndpoint } from "../lib/format-endpoint";
import { MethodBadge, StatusBadge } from "./api-log-badges";

interface ApiLogDetailDialogProps {
  log: LogEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiLogDetailDialog({
  log,
  open,
  onOpenChange,
}: ApiLogDetailDialogProps) {
  if (!log) {
    return null;
  }

  const formattedTime = new Date(log.createdAt).toLocaleString();
  const displayEndpoint = formatEndpoint(log.endpoint, log.method, log.metadata);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MethodBadge method={log.method} />
            <span>{displayEndpoint}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Status</span>
              <div className="mt-1">
                <StatusBadge statusCode={log.statusCode} />
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Duration</span>
              <div className="mt-1 font-medium">
                {log.durationMs ? `${log.durationMs}ms` : "-"}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Time</span>
              <div className="mt-1">{formattedTime}</div>
            </div>
            <div>
              <span className="text-muted-foreground">ID</span>
              <div className="mt-1 font-mono text-xs break-all">{log.id}</div>
            </div>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Full Endpoint</span>
            <div className="mt-1 font-mono text-xs break-all bg-muted p-2 rounded">
              {log.endpoint}
            </div>
          </div>
          {(() => {
            const meta = log.metadata as Record<string, unknown> | null | undefined;
            const fileName = meta?.fileName as string | undefined;
            const fileSize = meta?.fileSize as number | undefined;
            const thumbnailUrl = meta?.thumbnailUrl as string | undefined;
            if (!meta || Object.keys(meta).length === 0) return null;
            return (
              <div className="text-sm">
                <span className="text-muted-foreground">추가 정보</span>
                <div className="mt-1 bg-muted p-2 rounded space-y-2">
                  {thumbnailUrl && (
                    <div className="flex justify-center">
                      <img
                        src={thumbnailUrl}
                        alt={fileName || "미리보기"}
                        className="max-h-32 rounded object-contain"
                      />
                    </div>
                  )}
                  {fileName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">파일명:</span>
                      <span className="font-medium">{fileName}</span>
                    </div>
                  )}
                  {fileSize !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">크기:</span>
                      <span className="font-medium">{formatBytes(fileSize)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
