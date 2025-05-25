import { ProjectList } from "@/features/projects/list/ui/project-list";
import { ProjectListHeader } from "@/widgets/project/ui/project-list-header";

export default function ProjectsPage() {
  return (
    <div>
      <ProjectListHeader />

      {/* 프로젝트 목록 표시 */}
      <ProjectList />
    </div>
  );
}
