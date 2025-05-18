import { AlertCircle } from "lucide-react";

interface ProjectErrorProps {
  message?: string;
}

export function ProjectError({
  message = "알 수 없는 오류",
}: ProjectErrorProps) {
  return (
    <div className="border rounded-lg p-8 text-center border-destructive bg-destructive/10">
      <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
      <p className="text-destructive font-semibold">
        프로젝트 목록을 불러오는 중 오류가 발생했습니다.
      </p>
      <p className="text-sm text-destructive/80">{message}</p>
    </div>
  );
}
