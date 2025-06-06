"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { toast } from "sonner";
import { useGetApiKeyInfo } from "../model/get";
import { useGenerateApiKey } from "../model/generate";
import { useDeleteApiKey } from "../model/delete";
import { ApiKeySkeleton } from "@/entities/api-key/ui/api-key-skeleton";
import { ApiKeyDisplay } from "@/entities/api-key/ui/api-key-display";
import { ApiKeyStatus } from "@/entities/api-key/ui/api-key-status";
import { ApiKeyDeleteButton } from "@/entities/api-key/ui/api-key-delete-button";
import { ApiKeyError } from "@/entities/api-key/ui/api-key-error";
import { ApiKeyGenerateButton } from "@/entities/api-key/ui/api-key-generate-button";
import { useTranslations } from "next-intl";

export function ApiKeyManager() {
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const t = useTranslations("ApiKeyManager");
  const tSkeleton = useTranslations("ApiKeySkeleton");

  // API 키 정보 조회
  const { data: apiKeyInfo, isLoading, error: queryError } = useGetApiKeyInfo();

  // API 키 생성 (useMutation)
  const {
    mutate: generateMutate,
    isPending: isGenerating,
    error: generationError,
  } = useGenerateApiKey({
    onSuccessCallback: (newKey) => {
      setGeneratedKey(newKey);
      toast.success(t("generateSuccessToast"));
    },
    onErrorCallback: (err) => {
      toast.error(err instanceof Error ? err.message : t("generateErrorToast"));
    },
  });

  // API 키 삭제 (useMutation)
  const {
    mutate: deleteMutate,
    isPending: isDeleting,
    error: deletionError,
  } = useDeleteApiKey({
    onSuccessCallback: () => {
      setGeneratedKey(null); // 로컬에 저장된 키도 제거
      toast.success(t("deleteSuccessToast"));
    },
    onErrorCallback: (err) => {
      toast.error(err instanceof Error ? err.message : t("deleteErrorToast"));
    },
  });

  // 핸들러: 서버 액션 직접 호출 대신 mutate 함수 호출
  const handleGenerateKey = () => {
    setGeneratedKey(null); // 이전 생성 키 숨기기
    generateMutate();
  };

  // 에러 상태 통합 (쿼리, 생성, 삭제 에러 중 하나라도 있으면 표시)
  const error = queryError || generationError || deletionError;
  const errorMessage =
    error instanceof Error ? error.message : error ? t("unknownError") : null;

  if (isLoading) {
    return <ApiKeySkeleton />;
  }

  const apiKeyPrefix = apiKeyInfo?.prefix ?? null;
  const hasApiKey = Boolean(apiKeyPrefix);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{tSkeleton("title")}</CardTitle>
        <CardDescription>{t("cardDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ApiKeyError errorMessage={errorMessage} />

        {generatedKey && <ApiKeyDisplay apiKey={generatedKey} />}

        {!generatedKey && apiKeyPrefix && (
          <ApiKeyStatus hasApiKey={hasApiKey} apiKeyPrefix={apiKeyPrefix}>
            <ApiKeyDeleteButton
              onDelete={() => deleteMutate()}
              isDeleting={isDeleting}
            />
          </ApiKeyStatus>
        )}

        {!apiKeyPrefix && !generatedKey && (
          <ApiKeyStatus hasApiKey={hasApiKey} apiKeyPrefix={apiKeyPrefix} />
        )}
        {!apiKeyPrefix && !generatedKey && (
          <ApiKeyGenerateButton
            onGenerate={handleGenerateKey}
            isGenerating={isGenerating}
          />
        )}
      </CardContent>
    </Card>
  );
}
