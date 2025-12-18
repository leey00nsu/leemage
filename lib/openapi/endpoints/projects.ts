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

// GET /projects - 프로젝트 목록 조회
registry.registerPath({
  method: "get",
  path: "/projects",
  tags: ["Projects"],
  summary: "프로젝트 목록 조회",
  description: "모든 프로젝트 목록을 조회합니다.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "프로젝트 목록이 성공적으로 반환됩니다.",
      content: {
        "application/json": {
          schema: projectListResponseSchema,
        },
      },
    },
    401: {
      description: "인증 실패",
      content: {
        "application/json": {
          schema: unauthorizedErrorSchema,
        },
      },
    },
    500: {
      description: "서버 오류",
      content: {
        "application/json": {
          schema: serverErrorSchema,
        },
      },
    },
  },
});

// POST /projects - 프로젝트 생성
registry.registerPath({
  method: "post",
  path: "/projects",
  tags: ["Projects"],
  summary: "프로젝트 생성",
  description: "새로운 프로젝트를 생성합니다.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createProjectRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "프로젝트가 성공적으로 생성되었습니다.",
      content: {
        "application/json": {
          schema: projectResponseSchema,
        },
      },
    },
    400: {
      description: "잘못된 요청",
      content: {
        "application/json": {
          schema: badRequestErrorSchema,
        },
      },
    },
    401: {
      description: "인증 실패",
      content: {
        "application/json": {
          schema: unauthorizedErrorSchema,
        },
      },
    },
    500: {
      description: "서버 오류",
      content: {
        "application/json": {
          schema: serverErrorSchema,
        },
      },
    },
  },
});

// GET /projects/{projectId} - 프로젝트 상세 조회
registry.registerPath({
  method: "get",
  path: "/projects/{projectId}",
  tags: ["Projects"],
  summary: "프로젝트 상세 조회",
  description: "프로젝트 ID로 특정 프로젝트와 파일 목록을 조회합니다.",
  security: [{ bearerAuth: [] }],
  request: {
    params: projectIdParamSchema,
  },
  responses: {
    200: {
      description: "프로젝트가 성공적으로 반환됩니다.",
      content: {
        "application/json": {
          schema: projectDetailsResponseSchema,
        },
      },
    },
    401: {
      description: "인증 실패",
      content: {
        "application/json": {
          schema: unauthorizedErrorSchema,
        },
      },
    },
    404: {
      description: "프로젝트를 찾을 수 없음",
      content: {
        "application/json": {
          schema: projectNotFoundErrorSchema,
        },
      },
    },
    500: {
      description: "서버 오류",
      content: {
        "application/json": {
          schema: serverErrorSchema,
        },
      },
    },
  },
});

// DELETE /projects/{projectId} - 프로젝트 삭제
registry.registerPath({
  method: "delete",
  path: "/projects/{projectId}",
  tags: ["Projects"],
  summary: "프로젝트 삭제",
  description:
    "프로젝트 ID로 특정 프로젝트를 삭제합니다. 프로젝트에 속한 모든 파일도 함께 삭제됩니다.",
  security: [{ bearerAuth: [] }],
  request: {
    params: projectIdParamSchema,
  },
  responses: {
    200: {
      description: "프로젝트가 성공적으로 삭제되었습니다.",
      content: {
        "application/json": {
          schema: messageResponseSchema,
        },
      },
    },
    401: {
      description: "인증 실패",
      content: {
        "application/json": {
          schema: unauthorizedErrorSchema,
        },
      },
    },
    404: {
      description: "프로젝트를 찾을 수 없음",
      content: {
        "application/json": {
          schema: projectNotFoundErrorSchema,
        },
      },
    },
    500: {
      description: "서버 오류",
      content: {
        "application/json": {
          schema: serverErrorSchema,
        },
      },
    },
  },
});
