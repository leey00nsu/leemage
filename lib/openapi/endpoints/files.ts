import { registry } from "../registry";
import {
  fileIdParamSchema,
  fileResponseSchema,
  presignRequestSchema,
  presignResponseSchema,
  confirmRequestSchema,
  confirmResponseSchema,
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
    "Confirm after direct upload to OCI/R2. Image thumbnails and variants are processed synchronously. Videos return immediately after registration; a separate worker generates thumbnails asynchronously. Poll GET file for processingStatus.",
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

// DELETE /projects/{projectId}/files/{fileId} - Delete file
registry.registerPath({
  method: "delete",
  path: "/projects/{projectId}/files/{fileId}",
  tags: ["Files"],
  summary: "Delete file",
  description:
    "Delete a file with the specified ID and all related versions (including OCI storage).",
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
