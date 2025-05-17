"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import {
  Loader2,
  KeyRound,
  Trash2,
  Copy,
  Check,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useGetApiKeyInfo } from "../model/get";
import { useGenerateApiKey } from "../model/generate";
import { useDeleteApiKey } from "../model/delete";

export function ApiKeyManager() {
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // API 키 정보 조회
  const {
    data: apiKeyInfo,
    isLoading,
    error: queryError, // query용 에러 상태
  } = useGetApiKeyInfo();

  // API 키 생성 (useMutation)
  const {
    mutate: generateMutate,
    isPending: isGenerating,
    error: generationError, // generation용 에러 상태
  } = useGenerateApiKey({
    onSuccessCallback: (newKey) => {
      setGeneratedKey(newKey);
      toast.success("새 API 키가 생성되었습니다. 안전한 곳에 보관하세요!");
    },
    onErrorCallback: (err) => {
      toast.error(
        err instanceof Error ? err.message : "API 키 생성에 실패했습니다."
      );
    },
  });

  // API 키 삭제 (useMutation)
  const {
    mutate: deleteMutate,
    isPending: isDeleting,
    error: deletionError, // deletion용 에러 상태
  } = useDeleteApiKey({
    onSuccessCallback: () => {
      setGeneratedKey(null); // 로컬에 저장된 키도 제거
      toast.success("API 키가 삭제되었습니다.");
    },
    onErrorCallback: (err) => {
      toast.error(
        err instanceof Error ? err.message : "API 키 삭제에 실패했습니다."
      );
    },
  });

  // 핸들러: 서버 액션 직접 호출 대신 mutate 함수 호출
  const handleGenerateKey = () => {
    setGeneratedKey(null); // 이전 생성 키 숨기기
    setCopied(false);
    generateMutate();
  };

  const handleCopyKey = () => {
    if (!generatedKey) return;
    navigator.clipboard
      .writeText(generatedKey)
      .then(() => {
        setCopied(true);
        toast.success("API 키가 클립보드에 복사되었습니다.");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast.error("클립보드 복사에 실패했습니다.");
      });
  };

  // 에러 상태 통합 (쿼리, 생성, 삭제 에러 중 하나라도 있으면 표시)
  const error = queryError || generationError || deletionError;
  const errorMessage =
    error instanceof Error
      ? error.message
      : error
      ? "알 수 없는 오류 발생"
      : null;

  if (isLoading) {
    return (
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>API 키 관리</CardTitle>
          <CardDescription>API 키 정보를 불러오는 중...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center min-h-[10rem]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const apiKeyPrefix = apiKeyInfo?.prefix ?? null;

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>API 키 관리</CardTitle>
        <CardDescription>
          외부 서비스 연동을 위한 API 키를 관리합니다. API 키는 시스템당 하나만
          생성 가능합니다. 만약 API 키를 분실하였다면 새로 생성해야 합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage && (
          <Alert variant="destructive">
            <AlertTitle>오류 발생</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {generatedKey && (
          <Alert variant="default">
            <AlertTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
              <AlertTitle className="text-sm">새 API 키 생성됨</AlertTitle>
            </AlertTitle>

            <AlertDescription className="break-all">
              다음은 새로 생성된 API 키입니다. 이 키는 다시 표시되지 않으니
              반드시 안전한 곳에 복사하여 보관하세요.
            </AlertDescription>

            <AlertDescription className="p-3 bg-muted rounded-md flex items-center justify-between break-all">
              <span
                className="font-mono text-sm text-muted-foreground"
                title={generatedKey || ""}
              >
                {generatedKey || ""}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={handleCopyKey}
                disabled={copied}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="sr-only">복사</span>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {!generatedKey && apiKeyPrefix && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <div className="flex items-center">
              <KeyRound className="h-5 w-5 mr-2 text-muted-foreground" />
              <span className="font-mono text-sm">
                API 키가 설정되어 있습니다
              </span>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  삭제
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    이 작업은 되돌릴 수 없습니다. API 키가 영구적으로
                    삭제됩니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>
                    취소
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutate()}
                    disabled={isDeleting}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 삭제
                        중...
                      </>
                    ) : (
                      "삭제 확인"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {!apiKeyPrefix && !generatedKey && (
          <Alert>
            <AlertTitle>API 키 없음</AlertTitle>
            <AlertDescription>
              현재 시스템에 설정된 API 키가 없습니다. 외부 연동을 위해 새 키를
              생성하세요.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      {!apiKeyPrefix && !generatedKey && (
        <CardFooter>
          <Button onClick={handleGenerateKey} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="mr-2 h-4 w-4" />
            )}
            새 API 키 생성
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
