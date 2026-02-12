import { registry } from "../registry";
import {
  projectIdParamSchema,
  createProjectRequestSchema,
  projectResponseSchema,
  projectDetailsResponseSchema,
  projectListResponseSchema,
} from "../schemas/projects";
import {
  unauthorizedErrorSchema,
  projectNotFoundErrorSchema,
  serverErrorSchema,
  badRequestErrorSchema,
  messageResponseSchema,
} from "../schemas/common";

// GET /projects - List projects
registry.registerPath({
  method: "get",
  path: "/projects",
  tags: ["Projects"],
  summary: "List projects",
  description: "Retrieve all projects.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Project list returned successfully.",
      content: {
        "application/json": {
          schema: projectListResponseSchema,
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

// POST /projects - Create project
registry.registerPath({
  method: "post",
  path: "/projects",
  tags: ["Projects"],
  summary: "Create project",
  description: "Create a new project.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: createProjectRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Project created successfully.",
      content: {
        "application/json": {
          schema: projectResponseSchema,
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

// GET /projects/{projectId} - Get project details
registry.registerPath({
  method: "get",
  path: "/projects/{projectId}",
  tags: ["Projects"],
  summary: "Get project details",
  description: "Retrieve a specific project and its file list by project ID.",
  security: [{ bearerAuth: [] }],
  request: {
    params: projectIdParamSchema,
  },
  responses: {
    200: {
      description: "Project returned successfully.",
      content: {
        "application/json": {
          schema: projectDetailsResponseSchema,
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
      description: "Project not found",
      content: {
        "application/json": {
          schema: projectNotFoundErrorSchema,
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

// DELETE /projects/{projectId} - Delete project
registry.registerPath({
  method: "delete",
  path: "/projects/{projectId}",
  tags: ["Projects"],
  summary: "Delete project",
  description:
    "Delete a specific project by project ID. All files in the project are deleted as well.",
  security: [{ bearerAuth: [] }],
  request: {
    params: projectIdParamSchema,
  },
  responses: {
    200: {
      description: "Project deleted successfully.",
      content: {
        "application/json": {
          schema: messageResponseSchema,
          example: {
            message:
              "Project and all related files (all versions) deleted successfully.",
          },
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
      description: "Project not found",
      content: {
        "application/json": {
          schema: projectNotFoundErrorSchema,
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
