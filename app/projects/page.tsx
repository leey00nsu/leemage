import { Button } from "@/shared/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { ProjectList } from "@/features/projects/list/ui/project-list";

export default function ProjectsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">프로젝트 목록</h1>
        {/* TODO: 새 프로젝트 생성 페이지 또는 모달 연결 */}
        <Link href="/projects/new">
          <Button size="sm">
            <PlusCircle className="mr-2 h-4 w-4" /> 새 프로젝트 생성
          </Button>
        </Link>
      </div>

      {/* 프로젝트 목록 표시 */}
      <ProjectList />
    </div>
  );
}
