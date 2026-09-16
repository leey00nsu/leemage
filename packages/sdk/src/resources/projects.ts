import type { FetchClient } from "../utils/fetch";
import type {
  Project,
  ProjectListItem,
  ProjectDetails,
  CreateProjectRequest,
  UpdateProjectRequest,
  MessageResponse,
} from "../types/api";
import { encodePathSegment } from "../utils/path";

/**
 * Projects API 클라이언트
 */
export class ProjectsResource {
  constructor(private readonly client: FetchClient) {}

  /**
   * 프로젝트 목록 조회
   *
   * @example
   * ```ts
   * const projects = await client.projects.list();
   * console.log(projects);
   * ```
   */
  async list(): Promise<ProjectListItem[]> {
    return this.client.get<ProjectListItem[]>("/api/v1/projects");
  }

  /**
   * 프로젝트 상세 조회
   *
   * @param projectId - 프로젝트 ID
   *
   * @example
   * ```ts
   * const project = await client.projects.get("clq1234abcd");
   * console.log(project.files);
   * ```
   */
  async get(
    projectId: string,
    options: {
      tagIds?: string[];
      tagMode?: "all" | "any";
      page?: number;
      pageSize?: 25 | 50 | 100;
    } = {},
  ): Promise<ProjectDetails> {
    const encodedProjectId = encodePathSegment(projectId, "projectId");
    const query = new URLSearchParams();
    if (options.tagIds?.length) query.set("tags", options.tagIds.join(","));
    if (options.tagMode) query.set("tagMode", options.tagMode);
    if (options.page) query.set("page", String(options.page));
    if (options.pageSize) query.set("pageSize", String(options.pageSize));
    return this.client.get<ProjectDetails>(
      `/api/v1/projects/${encodedProjectId}${query.size ? `?${query}` : ""}`,
    );
  }

  /**
   * 프로젝트 생성
   *
   * @param data - 프로젝트 생성 데이터
   *
   * @example
   * ```ts
   * const project = await client.projects.create({
   *   name: "My Project",
   *   description: "Project description",
   *   storageProvider: "OCI"
   * });
   * ```
   */
  async create(data: CreateProjectRequest): Promise<Project> {
    return this.client.post<Project>("/api/v1/projects", data);
  }

  /**
   * 프로젝트 삭제
   *
   * @param projectId - 프로젝트 ID
   *
   * @example
   * ```ts
   * await client.projects.delete("clq1234abcd");
   * ```
   */
  async update(
    projectId: string,
    data: UpdateProjectRequest,
  ): Promise<Project> {
    return this.client.patch<Project>(
      `/api/v1/projects/${encodePathSegment(projectId, "projectId")}`,
      data,
    );
  }

  async delete(projectId: string): Promise<MessageResponse> {
    const encodedProjectId = encodePathSegment(projectId, "projectId");
    return this.client.delete<MessageResponse>(
      `/api/v1/projects/${encodedProjectId}`,
    );
  }
}
