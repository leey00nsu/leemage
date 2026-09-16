import { describe, expect, it, vi } from "vitest";
import { ProjectsResource } from "@/packages/sdk/src/resources/projects";
import type { FetchClient } from "@/packages/sdk/src/utils/fetch";
import type { CreateProjectRequest } from "@/packages/sdk/src/types/api";

describe("ProjectsResource", () => {
  it("calls client endpoints with correct paths", async () => {
    const client = {
      get: vi.fn().mockResolvedValue([{ id: "project-1" }]),
      patch: vi.fn().mockResolvedValue({ id: "project-123" }),
      post: vi.fn().mockResolvedValue({ id: "project-2" }),
      delete: vi.fn().mockResolvedValue({ message: "ok" }),
      put: vi.fn(),
      request: vi.fn(),
    } as unknown as FetchClient;

    const resource = new ProjectsResource(client);

    await resource.list();
    expect(client.get).toHaveBeenCalledWith("/api/v1/projects");

    await resource.get("project-123");
    expect(client.get).toHaveBeenCalledWith("/api/v1/projects/project-123");

    await resource.get("project-123", { page: 2, pageSize: 25 });
    expect(client.get).toHaveBeenCalledWith(
      "/api/v1/projects/project-123?page=2&pageSize=25",
    );

    const payload: CreateProjectRequest = {
      name: "Demo",
      description: "Test",
      storageProvider: "OCI",
    };
    await resource.create(payload);
    expect(client.post).toHaveBeenCalledWith("/api/v1/projects", payload);

    await resource.update("project-123", {
      maxUploadBytes: 100 * 1024 * 1024,
      videoThumbnailEnabled: false,
    });
    expect(client.patch).toHaveBeenCalledWith("/api/v1/projects/project-123", {
      maxUploadBytes: 104857600,
      videoThumbnailEnabled: false,
    });

    await resource.delete("project-123");
    expect(client.delete).toHaveBeenCalledWith("/api/v1/projects/project-123");
  });
});
