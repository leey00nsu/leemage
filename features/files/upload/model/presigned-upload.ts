"use client";

import { useState, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  uploadFileWithPresignedUrl,
  VariantOption,
  ConfirmResponse,
} from "../api/presigned-upload";
import { projectKeys } from "@/features/projects/model/query-keys";

// 업로드 상태 타입
export type UploadStatus =
  | "idle"
  | "presigning"
  | "uploading"
  | "confirming"
  | "processing"
  | "complete"
  | "error";

// 업로드 상태 인터페이스
export interface UploadState {
  status: UploadStatus;
  progress: number;
  error?: string;
  fileId?: string;
}

// 초기 상태
const initialState: UploadState = {
  status: "idle",
  progress: 0,
};

// usePresignedUpload 훅 옵션
interface UsePresignedUploadOptions {
  projectId: string;
  onSuccess?: (response: ConfirmResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Presigned URL 업로드를 위한 React 훅
 */
export function usePresignedUpload(options: UsePresignedUploadOptions) {
  const { projectId, onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const [state, setState] = useState<UploadState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 상태 업데이트 헬퍼
  const updateState = useCallback((updates: Partial<UploadState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // 진행률 업데이트 핸들러
  const handleProgress = useCallback(
    (progress: number) => {
      updateState({ progress });
    },
    [updateState]
  );

  // 업로드 mutation
  const mutation = useMutation({
    mutationFn: async ({
      file,
      variants,
    }: {
      file: File;
      variants?: VariantOption[];
    }) => {
      // AbortController 생성
      abortControllerRef.current = new AbortController();

      // Presigning 상태
      updateState({ status: "presigning", progress: 0 });

      try {
        // 업로드 시작 시 uploading 상태로 변경
        const response = await uploadFileWithPresignedUrl({
          projectId,
          file,
          variants,
          onProgress: (progress) => {
            updateState({ status: "uploading", progress });
          },
          signal: abortControllerRef.current.signal,
        });

        // 이미지 처리 중인 경우
        if (variants && variants.length > 0) {
          updateState({ status: "processing", progress: 100 });
        } else {
          updateState({ status: "confirming", progress: 100 });
        }

        return response;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (response) => {
      updateState({
        status: "complete",
        progress: 100,
        fileId: response.file.id,
      });

      // 프로젝트 상세 캐시 무효화 (파일 목록 포함)
      queryClient.invalidateQueries({
        queryKey: projectKeys.byId(projectId),
      });

      onSuccess?.(response);
    },
    onError: (error: Error) => {
      // 취소된 경우 idle로 복귀
      if (error.message === "업로드가 취소되었습니다.") {
        updateState({ status: "idle", progress: 0, error: undefined });
      } else {
        updateState({ status: "error", error: error.message });
      }

      onError?.(error);
    },
  });

  // 업로드 시작
  const upload = useCallback(
    (file: File, variants?: VariantOption[]) => {
      mutation.mutate({ file, variants });
    },
    [mutation]
  );

  // 업로드 취소
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // 상태 초기화
  const reset = useCallback(() => {
    setState(initialState);
    abortControllerRef.current = null;
  }, []);

  return {
    ...state,
    upload,
    cancel,
    reset,
    isUploading: state.status !== "idle" && state.status !== "complete" && state.status !== "error",
    isPending: mutation.isPending,
  };
}

// 이전 훅과의 호환성을 위한 별칭
export const usePresignedImageUpload = usePresignedUpload;
