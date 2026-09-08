"use client";
import { useQuery } from "@tanstack/react-query";
import { projectKeys } from "./query-keys";
export function useUploadPolicy(projectId?: string, enabled = true) {
  return useQuery({
    queryKey: [
      ...(projectId ? projectKeys.byId(projectId) : projectKeys.all()),
      "upload-policy",
    ],
    enabled,
    staleTime: 0,
    queryFn: async (): Promise<{
      maxUploadBytes: number;
      serverMaxUploadBytes: number;
      videoThumbnailEnabled: boolean;
    }> => {
      const response = await fetch(
        `/api/upload-policy${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ""}`,
      );
      if (!response.ok) throw new Error("Upload policy unavailable");
      return response.json();
    },
  });
}
