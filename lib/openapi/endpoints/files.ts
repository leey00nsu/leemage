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
  unauthorizedErrorSchema,
  fileNotFoundErrorSchema,
  serverErrorSchema,
  badRequestErrorSchema,
  messageResponseSchema,
} from "../schemas/common";

// POST /projects/{projectId}/files/presign - Presigned URL 생성
registry.registerPath({
  method: "post",
  path: "/projects/{projectId}/files/presign",
  tags: ["Files"],
  summary: "Presigned URL 생성",
  description:
    "파일 업로드를 위한 Presigned URL을 생성합니다. 클라이언트는 이 URL을 사용하여 OCI에 직접 파일을 업로드할 수 있습니다.",
  security: [{ bearerAuth: [] }],
  request: {
    params: projectIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: presignRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Presigned URL이 성공적으로 생성되었습니다.",
      content: {
        "application/json": {
          schema: presignResponseSchema,
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
    413: {
      description: "파일 크기 초과 또는 스토리지 한도 초과",
      content: {
        "application/json": {
          schema: badRequestErrorSchema,
        },
      },
    },
  },
});

// POST /projects/{projectId}/files/confirm - 업로드 완료 확인
registry.registerPath({
  method: "post",
  path: "/projects/{projectId}/files/confirm",
  tags: ["Files"],
  summary: "업로드 완료 확인",
  description:
    "OCI에 직접 업로드 완료 후 호출하여 DB에 파일 레코드를 생성합니다. 이미지 파일의 경우 variants 옵션으로 변환 처리를 요청할 수 있습니다.",
  security: [{ bearerAuth: [] }],
  request: {
    params: projectIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: confirmRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "파일 레코드가 성공적으로 생성되었습니다.",
      content: {
        "application/json": {
          schema: confirmResponseSchema,
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
    404: {
      description: "파일을 찾을 수 없음",
      content: {
        "application/json": {
          schema: fileNotFoundErrorSchema,
        },
      },
    },
  },
});

// DELETE /projects/{projectId}/files/{fileId} - 파일 삭제
registry.registerPath({
  method: "delete",
  path: "/projects/{projectId}/files/{fileId}",
  tags: ["Files"],
  summary: "파일 삭제",
  description:
    "특정 ID를 가진 파일 및 관련된 모든 버전을 삭제합니다. (OCI 스토리지 포함)",
  security: [{ bearerAuth: [] }],
  request: {
    params: fileIdParamSchema,
  },
  responses: {
    200: {
      description: "파일 삭제 성공",
      content: {
        "application/json": {
          schema: messageResponseSchema,
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
    404: {
      description: "파일을 찾을 수 없음",
      content: {
        "application/json": {
          schema: fileNotFoundErrorSchema,
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
