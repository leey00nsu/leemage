import { UploadProgress } from "@/entities/images/upload/ui/upload-progress";

export default function Playground() {
  return (
    <div>
      <UploadProgress isUploading={true} error={new Error("test")} />
    </div>
  );
}
