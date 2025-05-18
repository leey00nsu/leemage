interface EmptyProjectStateProps {
  message?: string;
}

export function EmptyProjectState({
  message = "아직 생성된 프로젝트가 없습니다.\n'새 프로젝트 생성' 버튼을 클릭하여 시작하세요.",
}: EmptyProjectStateProps) {
  return (
    <div className="border rounded-lg p-8 text-center border-dashed">
      <p className="text-muted-foreground whitespace-pre-line">{message}</p>
    </div>
  );
}
