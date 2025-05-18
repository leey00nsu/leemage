import { ApiCategory } from "./types";

export const apiDocsData: ApiCategory[] = [
  {
    name: "프로젝트",
    description: "프로젝트 관련 API 엔드포인트",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/projects",
        description: "모든 프로젝트 목록을 조회합니다.",
        auth: true,
        responses: [
          {
            status: 200,
            description: "프로젝트 목록이 성공적으로 반환됩니다.",
            example: [
              {
                id: "clq1234abcd",
                name: "샘플 프로젝트",
                description: "이것은 샘플 프로젝트입니다.",
                createdAt: "2023-01-01T00:00:00.000Z",
                updatedAt: "2023-01-01T00:00:00.000Z",
              },
            ],
          },
          {
            status: 401,
            description: "인증 실패",
            example: {
              message: "인증 실패: 유효하지 않은 API 키",
            },
          },
          {
            status: 500,
            description: "서버 오류",
            example: {
              message: "프로젝트 목록 조회 중 오류가 발생했습니다.",
            },
          },
        ],
      },
      {
        method: "POST",
        path: "/api/v1/projects",
        description: "새로운 프로젝트를 생성합니다.",
        auth: true,
        requestBody: {
          type: "object",
          properties: [
            {
              name: "name",
              type: "string",
              required: true,
              description: "프로젝트 이름",
            },
            {
              name: "description",
              type: "string",
              required: false,
              description: "프로젝트 설명",
            },
          ],
        },
        responses: [
          {
            status: 201,
            description: "프로젝트가 성공적으로 생성되었습니다.",
            example: {
              id: "clq1234abcd",
              name: "새 프로젝트",
              description: "새 프로젝트 설명",
              createdAt: "2023-01-01T00:00:00.000Z",
              updatedAt: "2023-01-01T00:00:00.000Z",
            },
          },
          {
            status: 400,
            description: "잘못된 요청",
            example: {
              message: "잘못된 요청 형식입니다.",
              errors: {
                name: ["required"],
              },
            },
          },
          {
            status: 401,
            description: "인증 실패",
            example: {
              message: "인증 실패: 유효하지 않은 API 키",
            },
          },
          {
            status: 500,
            description: "서버 오류",
            example: {
              message: "프로젝트 생성 중 오류가 발생했습니다.",
            },
          },
        ],
      },
      {
        method: "GET",
        path: "/api/v1/projects/[projectId]",
        description: "프로젝트 ID로 특정 프로젝트를 조회합니다.",
        auth: true,
        parameters: [
          {
            name: "projectId",
            type: "string",
            required: true,
            description: "조회할 프로젝트의 ID",
          },
        ],
        responses: [
          {
            status: 200,
            description: "프로젝트가 성공적으로 반환됩니다.",
            example: {
              id: "clq1234abcd",
              name: "샘플 프로젝트",
              description: "이것은 샘플 프로젝트입니다.",
              createdAt: "2023-01-01T00:00:00.000Z",
              updatedAt: "2023-01-01T00:00:00.000Z",
              images: [
                {
                  id: "img1234abcd",
                  name: "샘플 이미지",
                  variants: [
                    {
                      id: "var1234abcd",
                      url: "https://example.com/image.jpg",
                      type: "original",
                    },
                  ],
                  createdAt: "2023-01-01T00:00:00.000Z",
                  updatedAt: "2023-01-01T00:00:00.000Z",
                  projectId: "clq1234abcd",
                },
              ],
            },
          },
          {
            status: 401,
            description: "인증 실패",
            example: {
              message: "인증 실패: 유효하지 않은 API 키",
            },
          },
          {
            status: 404,
            description: "프로젝트를 찾을 수 없음",
            example: {
              message: "Project not found",
            },
          },
          {
            status: 500,
            description: "서버 오류",
            example: {
              message: "Error fetching project",
            },
          },
        ],
      },
      {
        method: "DELETE",
        path: "/api/v1/projects/[projectId]",
        description: "프로젝트 ID로 특정 프로젝트를 삭제합니다.",
        auth: true,
        parameters: [
          {
            name: "projectId",
            type: "string",
            required: true,
            description: "삭제할 프로젝트의 ID",
          },
        ],
        responses: [
          {
            status: 200,
            description: "프로젝트가 성공적으로 삭제되었습니다.",
            example: {
              message: "프로젝트가 성공적으로 삭제되었습니다.",
            },
          },
          {
            status: 401,
            description: "인증 실패",
            example: {
              message: "인증 실패: 유효하지 않은 API 키",
            },
          },
          {
            status: 404,
            description: "프로젝트를 찾을 수 없음",
            example: {
              message: "Project not found",
            },
          },
          {
            status: 500,
            description: "서버 오류",
            example: {
              message: "Error deleting project",
            },
          },
        ],
      },
    ],
  },
  {
    name: "이미지",
    description: "이미지 관련 API 엔드포인트",
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/projects/[projectId]/images",
        description:
          "특정 프로젝트에 새 이미지를 업로드하고 지정된 형식/크기로 변환하여 저장합니다.",
        auth: true,
        parameters: [
          {
            name: "projectId",
            type: "string",
            required: true,
            description: "이미지를 업로드할 프로젝트의 ID",
          },
        ],
        requestBody: {
          type: "multipart/form-data",
          properties: [
            {
              name: "file",
              type: "file",
              required: true,
              description: "업로드할 이미지 파일",
            },
            {
              name: "variants",
              type: "JSON 문자열 배열",
              required: true,
              description:
                '생성할 이미지 버전 옵션. 각 요소는 { "sizeLabel": "300x300" | "800x800" | "1920x1080", "format": "png" | "jpeg" | "avif" | "webp" } 형태',
            },
            {
              name: "saveOriginal",
              type: "string",
              required: false,
              description:
                '"true" 또는 "false". 원본 이미지 저장 여부 (기본값: true)',
            },
          ],
        },
        responses: [
          {
            status: 201,
            description: "모든 버전 처리 성공 시",
            example: {
              image: {
                id: "img1234abcd",
                name: "uploaded_image.jpg",
                variants: [
                  {
                    url: "https://example.com/images/var1234abcd.jpg",
                    width: 800,
                    height: 800,
                    size: 102400,
                    format: "jpeg",
                    label: "800x800",
                  },
                ],
                projectId: "clq1234abcd",
              },
            },
          },
          {
            status: 207,
            description: "일부 버전 처리 실패 시",
            example: {
              message: "일부 이미지 변환 처리 실패",
              image: {
                id: "img1234abcd",
                name: "uploaded_image.jpg",
                variants: [
                  {
                    url: "https://example.com/images/var1234abcd.jpg",
                    width: 800,
                    height: 800,
                    size: 102400,
                    format: "jpeg",
                    label: "800x800",
                  },
                ],
                projectId: "clq1234abcd",
              },
              errors: [
                {
                  label: "1920x1080",
                  error: "이미지 변환 처리 중 오류가 발생했습니다.",
                },
              ],
            },
          },
          {
            status: 400,
            description: "잘못된 요청",
            example: {
              message: "필수 파라미터가 누락되었습니다.",
            },
          },
          {
            status: 401,
            description: "인증 실패",
            example: {
              message: "인증 실패: 유효하지 않은 API 키",
            },
          },
          {
            status: 415,
            description: "지원하지 않는 미디어 타입",
            example: {
              message: "Content-Type이 multipart/form-data가 아닙니다.",
            },
          },
          {
            status: 500,
            description: "서버 오류",
            example: {
              message: "이미지 처리 중 오류가 발생했습니다.",
            },
          },
        ],
      },
      {
        method: "DELETE",
        path: "/api/v1/projects/[projectId]/images/[imageId]",
        description:
          "특정 ID를 가진 이미지 및 관련된 모든 버전의 파일을 삭제합니다. (OCI 스토리지 포함)",
        auth: true,
        parameters: [
          {
            name: "projectId",
            type: "string",
            required: true,
            description: "이미지가 속한 프로젝트의 ID (경로 검증용)",
          },
          {
            name: "imageId",
            type: "string",
            required: true,
            description: "삭제할 이미지의 ID",
          },
        ],
        responses: [
          {
            status: 200,
            description: "이미지 삭제 성공",
            example: {
              message: "Image deleted successfully",
            },
          },
          {
            status: 400,
            description: "잘못된 요청",
            example: {
              message: "imageId가 누락되었습니다.",
            },
          },
          {
            status: 401,
            description: "인증 실패",
            example: {
              message: "인증 실패: 유효하지 않은 API 키",
            },
          },
          {
            status: 404,
            description: "이미지를 찾을 수 없음",
            example: {
              message:
                "해당 imageId의 이미지가 없거나 projectId가 일치하지 않습니다.",
            },
          },
          {
            status: 500,
            description: "서버 오류",
            example: {
              message: "이미지 삭제 중 오류가 발생했습니다.",
            },
          },
        ],
      },
    ],
  },
];
