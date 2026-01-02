import { describe, expect, it, vi } from "vitest";
import { ProjectsResource } from "@/packages/sdk/src/resources/projects";
import type { FetchClient } from "@/packages/sdk/src/utils/fetch";
import type { CreateProjectRequest } from "@/packages/sdk/src/types/api";

describe("ProjectsResource", () => {
  it("calls client endpoints with correct paths", async () => {
    const client = {
      get: vi.fn().mockResolvedValue([{ id: "project-1" }]),
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

    const payload: CreateProjectRequest = {
      name: "Demo",
      description: "Test",
      storageProvider: "OCI",
    };
    await resource.create(payload);
    expect(client.post).toHaveBeenCalledWith("/api/v1/projects", payload);

    await resource.delete("project-123");
    expect(client.delete).toHaveBeenCalledWith(
      "/api/v1/projects/project-123"
    );
  });
});
