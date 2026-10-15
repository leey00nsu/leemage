import { registry } from "../registry";
import {
  fileIdParamSchema,
  fileResponseSchema,
  presignRequestSchema,
  presignResponseSchema,
  confirmRequestSchema,
  confirmResponseSchema,
  deleteFilesRequestSchema,
} from "../schemas/files";
import { projectIdParamSchema } from "../schemas/projects";
import {
  errorResponseSchema,
  unauthorizedErrorSchema,
  fileNotFoundErrorSchema,
  serverErrorSchema,
  badRequestErrorSchema,
  messageResponseSchema,
} from "../schemas/common";

// POST /projects/{projectId}/files/presign - Generate presigned URL
registry.registerPath({
  method: "post",
  path: "/projects/{projectId}/files/presign",
  tags: ["Files"],
  summary: "Generate presigned URL",
  description:
    "Generate a presigned URL for file upload. Clients upload directly to the project storage provider (OCI/R2). The project file limit and server ceiling apply.",
  security: [{ bearerAuth: [] }],
  request: {
    params: projectIdParamSchema,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: presignRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Presigned URL generated successfully.",
      content: {
        "application/json": {
          schema: presignResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid request",
      content: {
        "application/json": {
          schema: badRequestErrorSchema,
        },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": {
          schema: unauthorizedErrorSchema,
        },
      },
    },
    413: {
      description: "File size exceeded or storage quota exceeded",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: serverErrorSchema,
        },
      },
    },
  },
});

// POST /projects/{projectId}/files/confirm - Confirm upload
registry.registerPath({
  method: "post",
  path: "/projects/{projectId}/files/confirm",
  tags: ["Files"],
  summary: "Confirm upload",
  description:
    "Confirm after direct upload to OCI/R2. Image variants and video thumbnails are processed by a durable background worker. Poll GET file for processingStatus.",
  security: [{ bearerAuth: [] }],
  request: {
    params: projectIdParamSchema,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: confirmRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "File record created successfully.",
      content: {
        "application/json": {
          schema: confirmResponseSchema,
          example: {
            message: "Image upload and processing complete",
            file: {
              id: "file5678efgh",
              name: "image.jpg",
              mimeType: "image/jpeg",
              isImage: true,
              size: 102400,
              url: null,
              variants: [
                {
                  url: "https://objectstorage.ap-seoul-1.oraclecloud.com/...",
                  width: 1920,
                  height: 1080,
                  size: 102400,
                  format: "jpeg",
                  label: "1920x1080",
                },
              ],
              createdAt: "2023-01-01T00:00:00.000Z",
              updatedAt: "2023-01-01T00:00:00.000Z",
              projectId: "clq1234abcd",
            },
            variants: [
              {
                url: "https://objectstorage.ap-seoul-1.oraclecloud.com/...",
                width: 1920,
                height: 1080,
                size: 102400,
                format: "jpeg",
                label: "1920x1080",
              },
            ],
          },
        },
      },
    },
    400: {
      description: "Invalid request",
      content: {
        "application/json": {
          schema: badRequestErrorSchema,
        },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": {
          schema: unauthorizedErrorSchema,
        },
      },
    },
    404: {
      description: "File not found",
      content: {
        "application/json": {
          schema: fileNotFoundErrorSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: serverErrorSchema,
        },
      },
    },
  },
});

// POST /projects/{projectId}/files/bulk-delete - Delete multiple files
registry.registerPath({
  method: "post",
  path: "/projects/{projectId}/files/bulk-delete",
  tags: ["Files"],
  summary: "Delete multiple files",
  "x-permission-method": "DELETE",
  description:
    "Delete 1–100 files in one transaction and queue their original and variant objects for batched OCI/R2 cleanup. Requires DELETE permission despite using POST. Duplicate IDs are deduplicated. If any file is missing or belongs to another project, nothing is deleted.",
  security: [{ bearerAuth: [] }],
  request: {
    params: projectIdParamSchema,
    body: {
      required: true,
      content: { "application/json": { schema: deleteFilesRequestSchema } },
    },
  },
  responses: {
    200: { description: "Files deleted; storage cleanup queued", content: { "application/json": { schema: messageResponseSchema } } },
    400: { description: "Invalid request", content: { "application/json": { schema: badRequestErrorSchema } } },
    401: { description: "Authentication failed", content: { "application/json": { schema: unauthorizedErrorSchema } } },
    403: { description: "DELETE permission required", content: { "application/json": { schema: errorResponseSchema } } },
    404: { description: "One or more files not found", content: { "application/json": { schema: fileNotFoundErrorSchema } } },
    500: { description: "Server error", content: { "application/json": { schema: serverErrorSchema } } },
  },
});

// DELETE /projects/{projectId}/files/{fileId} - Delete file
registry.registerPath({
  method: "delete",
  path: "/projects/{projectId}/files/{fileId}",
  tags: ["Files"],
  summary: "Delete file",
  description:
    "Delete a file and queue all related objects for batched OCI/R2 storage cleanup.",
  security: [{ bearerAuth: [] }],
  request: {
    params: fileIdParamSchema,
  },
  responses: {
    200: {
      description: "File deleted successfully",
      content: {
        "application/json": {
          schema: messageResponseSchema,
          example: {
            message: "File deleted successfully.",
          },
        },
      },
    },
    400: {
      description: "Invalid request",
      content: {
        "application/json": {
          schema: badRequestErrorSchema,
        },
      },
    },
    401: {
      description: "Authentication failed",
      content: {
        "application/json": {
          schema: unauthorizedErrorSchema,
        },
      },
    },
    404: {
      description: "File not found",
      content: {
        "application/json": {
          schema: fileNotFoundErrorSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: serverErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/projects/{projectId}/files/{fileId}",
  tags: ["Files"],
  summary: "Get a file and video processing status",
  security: [{ bearerAuth: [] }],
  request: { params: projectIdParamSchema.merge(fileIdParamSchema) },
  responses: {
    200: {
      description: "File including current variants and processingStatus",
      content: { "application/json": { schema: fileResponseSchema } },
    },
    404: { description: "File not found" },
  },
});
