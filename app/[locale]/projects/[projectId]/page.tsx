"use client";

import { useParams } from "next/navigation";
import { ProjectDetailsWidget } from "@/widgets/project/ui/project-detail-widget"; // 위젯 임포트

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  // projectId가 유효한 경우에만 위젯 렌더링 (선택적 방어 로직)
  if (!projectId) {
    // 혹은 에러 페이지나 다른 처리
    return <div>유효하지 않은 프로젝트 ID입니다.</div>;
  }

  return <ProjectDetailsWidget projectId={projectId} />;
}
