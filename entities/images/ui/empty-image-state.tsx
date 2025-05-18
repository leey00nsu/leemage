import { ImageIcon } from "lucide-react";

interface EmptyImageStateProps {
  message?: string;
}

export function EmptyImageState({
  message = "아직 이미지가 없습니다.",
}: EmptyImageStateProps) {
  return (
    <div className="border rounded-lg p-8 text-center border-dashed">
      <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
