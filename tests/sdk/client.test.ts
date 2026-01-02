import { describe, expect, it } from "vitest";
import { LeemageClient } from "@/packages/sdk/src/client";
import { ProjectsResource } from "@/packages/sdk/src/resources/projects";
import { FilesResource } from "@/packages/sdk/src/resources/files";

describe("LeemageClient", () => {
  it("throws when apiKey is missing", () => {
    expect(() => new LeemageClient({ apiKey: "" })).toThrow();
  });

  it("initializes resource clients", () => {
    const client = new LeemageClient({ apiKey: "test-key" });

    expect(client.projects).toBeInstanceOf(ProjectsResource);
    expect(client.files).toBeInstanceOf(FilesResource);
  });
});
