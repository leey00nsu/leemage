import type { FetchClient } from "../utils/fetch";
import type {
  ProjectTag,
  FileTagsRequest,
  MessageResponse,
} from "../types/api";
import { encodePathSegment } from "../utils/path";

/** Project-scoped tags. Mutations require write access; deletion requires delete access. */
export class TagsResource {
  constructor(private readonly client: FetchClient) {}
  private path(projectId: string) {
    return `/api/v1/projects/${encodePathSegment(projectId, "projectId")}`;
  }
  list(projectId: string): Promise<ProjectTag[]> {
    return this.client.get(`${this.path(projectId)}/tags`);
  }
  create(projectId: string, name: string): Promise<ProjectTag> {
    return this.client.post(`${this.path(projectId)}/tags`, { name });
  }
  rename(projectId: string, tagId: string, name: string): Promise<ProjectTag> {
    return this.client.put(
      `${this.path(projectId)}/tags/${encodePathSegment(tagId, "tagId")}`,
      { name },
    );
  }
  delete(projectId: string, tagId: string): Promise<MessageResponse> {
    return this.client.delete(
      `${this.path(projectId)}/tags/${encodePathSegment(tagId, "tagId")}`,
    );
  }
  /** Adds or removes tags on 1–100 completed files, preserving unrelated tags. */
  apply(projectId: string, data: FileTagsRequest): Promise<MessageResponse> {
    return this.client.put(`${this.path(projectId)}/files/tags`, data);
  }
}
