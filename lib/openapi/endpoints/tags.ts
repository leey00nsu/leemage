import { z } from "zod";
import { registry } from "../registry";
import {
  projectTagSchema,
  tagNameRequestSchema,
  fileTagsRequestSchema,
} from "../schemas/tags";
import { messageResponseSchema, errorResponseSchema } from "../schemas/common";

const json = (schema: z.ZodTypeAny) => ({ "application/json": { schema } });
for (const config of [
  {
    method: "get" as const,
    path: "/projects/{projectId}/tags",
    summary: "List project tags",
    response: z.array(projectTagSchema),
    status: 200,
  },
  {
    method: "post" as const,
    path: "/projects/{projectId}/tags",
    summary: "Create a project tag",
    body: tagNameRequestSchema,
    response: projectTagSchema,
    status: 201,
  },
  {
    method: "put" as const,
    path: "/projects/{projectId}/tags/{tagId}",
    summary: "Rename a project tag",
    body: tagNameRequestSchema,
    response: projectTagSchema,
    status: 200,
  },
  {
    method: "delete" as const,
    path: "/projects/{projectId}/tags/{tagId}",
    summary: "Delete a tag, preserving files",
    response: messageResponseSchema,
    status: 200,
  },
  {
    method: "put" as const,
    path: "/projects/{projectId}/files/tags",
    summary: "Add or remove tags on up to 100 files atomically",
    body: fileTagsRequestSchema,
    response: messageResponseSchema,
    status: 200,
  },
])
  registry.registerPath({
    method: config.method,
    path: config.path,
    tags: ["Tags"],
    summary: config.summary,
    description:
      "Tags and files must belong to the specified project owned by the caller. Tag names are trimmed, NFC normalized, and unique within a project ignoring case (1–40 characters). Adding an existing assignment is idempotent. Removing tags preserves other assignments. Deleting a tag does not delete files.",
    security: [{ bearerAuth: [] }],
    request: {
      params: config.path.includes("{tagId}")
        ? z.object({ projectId: z.string(), tagId: z.string() })
        : z.object({ projectId: z.string() }),
      ...(config.body
        ? { body: { required: true, content: json(config.body) } }
        : {}),
    },
    responses: {
      [config.status]: {
        description: "Success",
        content: json(config.response),
      },
      400: {
        description: "Invalid request",
        content: json(errorResponseSchema),
      },
      401: {
        description: "Authentication required",
        content: json(errorResponseSchema),
      },
      403: {
        description: "API key lacks the required method permission",
        content: json(errorResponseSchema),
      },
      404: {
        description: "Project, tag, or file not found or outside the project",
        content: json(errorResponseSchema),
      },
      409: {
        description: "Duplicate tag name",
        content: json(errorResponseSchema),
      },
    },
  });
