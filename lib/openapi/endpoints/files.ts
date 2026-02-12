import { registry } from "../registry";
import {
  fileIdParamSchema,
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
    "Generate a presigned URL for file upload. Clients can use this URL to upload files directly to OCI.",
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
    "Call this after direct upload to OCI to create a file record in the database. For image files, variants can be provided to request transformation.",
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
