import { ApiCategory } from "./types";
import { getTranslations } from "next-intl/server";

export const getApiDocsData = async (
  locale: string
): Promise<ApiCategory[]> => {
  const t = await getTranslations({ locale, namespace: "ApiDocsData" });

  return [
    {
      name: t("categories.projects.name"),
      description: t("categories.projects.description"),
      endpoints: [
        {
          method: "GET",
          path: "/api/v1/projects",
          description: t(
            "categories.projects.endpoints.getProjects.description"
          ),
          auth: true,
          responses: [
            {
              status: 200,
              description: t(
                "categories.projects.endpoints.getProjects.responses.200.description"
              ),
              example: [
                {
                  id: "clq1234abcd",
                  name: t(
                    "categories.projects.endpoints.getProjects.responses.200.example.0.name"
                  ),
                  description: t(
                    "categories.projects.endpoints.getProjects.responses.200.example.0.description"
                  ),
                  createdAt: "2023-01-01T00:00:00.000Z",
                  updatedAt: "2023-01-01T00:00:00.000Z",
                },
              ],
            },
            {
              status: 401,
              description: t(
                "categories.projects.endpoints.getProjects.responses.401.description"
              ),
              example: {
                message: t(
                  "categories.projects.endpoints.getProjects.responses.401.example.message"
                ),
              },
            },
            {
              status: 500,
              description: t(
                "categories.projects.endpoints.getProjects.responses.500.description"
              ),
              example: {
                message: t(
                  "categories.projects.endpoints.getProjects.responses.500.example.message"
                ),
              },
            },
          ],
        },
        {
          method: "POST",
          path: "/api/v1/projects",
          description: t(
            "categories.projects.endpoints.createProject.description"
          ),
          auth: true,
          requestBody: {
            type: "object",
            properties: [
              {
                name: "name",
                type: "string",
                required: true,
                description: t(
                  "categories.projects.endpoints.createProject.requestBody.properties.name.description"
                ),
              },
              {
                name: "description",
                type: "string",
                required: false,
                description: t(
                  "categories.projects.endpoints.createProject.requestBody.properties.description.description"
                ),
              },
            ],
          },
          responses: [
            {
              status: 201,
              description: t(
                "categories.projects.endpoints.createProject.responses.201.description"
              ),
              example: {
                id: "clq1234abcd",
                name: t(
                  "categories.projects.endpoints.createProject.responses.201.example.name"
                ),
                description: t(
                  "categories.projects.endpoints.createProject.responses.201.example.description"
                ),
                createdAt: "2023-01-01T00:00:00.000Z",
                updatedAt: "2023-01-01T00:00:00.000Z",
              },
            },
            {
              status: 400,
              description: t(
                "categories.projects.endpoints.createProject.responses.400.description"
              ),
              example: {
                message: t(
                  "categories.projects.endpoints.createProject.responses.400.example.message"
                ),
                errors: {
                  name: ["required"],
                },
              },
            },
            {
              status: 401,
              description: t(
                "categories.projects.endpoints.createProject.responses.401.description"
              ),
              example: {
                message: t(
                  "categories.projects.endpoints.createProject.responses.401.example.message"
                ),
              },
            },
            {
              status: 500,
              description: t(
                "categories.projects.endpoints.createProject.responses.500.description"
              ),
              example: {
                message: t(
                  "categories.projects.endpoints.createProject.responses.500.example.message"
                ),
              },
            },
          ],
        },
        {
          method: "GET",
          path: "/api/v1/projects/[projectId]",
          description: t(
            "categories.projects.endpoints.getProjectById.description"
          ),
          auth: true,
          parameters: [
            {
              name: "projectId",
              type: "string",
              required: true,
              description: t(
                "categories.projects.endpoints.getProjectById.parameters.projectId.description"
              ),
            },
          ],
          responses: [
            {
              status: 200,
              description: t(
                "categories.projects.endpoints.getProjectById.responses.200.description"
              ),
              example: {
                id: "clq1234abcd",
                name: t(
                  "categories.projects.endpoints.getProjectById.responses.200.example.name"
                ),
                description: t(
                  "categories.projects.endpoints.getProjectById.responses.200.example.description"
                ),
                createdAt: "2023-01-01T00:00:00.000Z",
                updatedAt: "2023-01-01T00:00:00.000Z",
                files: [
                  {
                    id: "file1234abcd",
                    name: t(
                      "categories.projects.endpoints.getProjectById.responses.200.example.files.0.name"
                    ),
                    mimeType: "image/jpeg",
                    isImage: true,
                    size: 102400,
                    variants: [
                      {
                        url: "https://example.com/image.jpg",
                        label: "original",
                        format: "jpeg",
                        width: 1920,
                        height: 1080,
                        size: 102400,
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
              description: t(
                "categories.projects.endpoints.getProjectById.responses.401.description"
              ),
              example: {
                message: t(
                  "categories.projects.endpoints.getProjectById.responses.401.example.message"
                ),
              },
            },
            {
              status: 404,
              description: t(
                "categories.projects.endpoints.getProjectById.responses.404.description"
              ),
              example: {
                message: t(
                  "categories.projects.endpoints.getProjectById.responses.404.example.message"
                ),
              },
            },
            {
              status: 500,
              description: t(
                "categories.projects.endpoints.getProjectById.responses.500.description"
              ),
              example: {
                message: t(
                  "categories.projects.endpoints.getProjectById.responses.500.example.message"
                ),
              },
            },
          ],
        },
        {
          method: "DELETE",
          path: "/api/v1/projects/[projectId]",
          description: t(
            "categories.projects.endpoints.deleteProjectById.description"
          ),
          auth: true,
          parameters: [
            {
              name: "projectId",
              type: "string",
              required: true,
              description: t(
                "categories.projects.endpoints.deleteProjectById.parameters.projectId.description"
              ),
            },
          ],
          responses: [
            {
              status: 200,
              description: t(
                "categories.projects.endpoints.deleteProjectById.responses.200.description"
              ),
              example: {
                message: t(
                  "categories.projects.endpoints.deleteProjectById.responses.200.example.message"
                ),
              },
            },
            {
              status: 401,
              description: t(
                "categories.projects.endpoints.deleteProjectById.responses.401.description"
              ),
              example: {
                message: t(
                  "categories.projects.endpoints.deleteProjectById.responses.401.example.message"
                ),
              },
            },
            {
              status: 404,
              description: t(
                "categories.projects.endpoints.deleteProjectById.responses.404.description"
              ),
              example: {
                message: t(
                  "categories.projects.endpoints.deleteProjectById.responses.404.example.message"
                ),
              },
            },
            {
              status: 500,
              description: t(
                "categories.projects.endpoints.deleteProjectById.responses.500.description"
              ),
              example: {
                message: t(
                  "categories.projects.endpoints.deleteProjectById.responses.500.example.message"
                ),
              },
            },
          ],
        },
      ],
    },
    {
      name: t("categories.files.name"),
      description: t("categories.files.description"),
      endpoints: [
        // Presigned URL 요청 (신규)
        {
          method: "POST",
          path: "/api/v1/projects/[projectId]/files/presign",
          description: t("categories.files.endpoints.presignFile.description"),
          auth: true,
          parameters: [
            {
              name: "projectId",
              type: "string",
              required: true,
              description: t(
                "categories.files.endpoints.presignFile.parameters.projectId.description"
              ),
            },
          ],
          requestBody: {
            type: "object",
            properties: [
              {
                name: "fileName",
                type: "string",
                required: true,
                description: t(
                  "categories.files.endpoints.presignFile.requestBody.properties.fileName.description"
                ),
              },
              {
                name: "contentType",
                type: "string",
                required: true,
                description: t(
                  "categories.files.endpoints.presignFile.requestBody.properties.contentType.description"
                ),
              },
              {
                name: "fileSize",
                type: "number",
                required: true,
                description: t(
                  "categories.files.endpoints.presignFile.requestBody.properties.fileSize.description"
                ),
              },
            ],
          },
          responses: [
            {
              status: 200,
              description: t(
                "categories.files.endpoints.presignFile.responses.200.description"
              ),
              example: {
                presignedUrl: "https://objectstorage.ap-seoul-1.oraclecloud.com/p/...",
                objectName: "clq1234abcd/file5678efgh.jpg",
                objectUrl: "https://objectstorage.ap-seoul-1.oraclecloud.com/n/.../o/...",
                fileId: "file5678efgh",
                expiresAt: "2023-01-01T00:15:00.000Z",
              },
            },
            {
              status: 400,
              description: t(
                "categories.files.endpoints.presignFile.responses.400.description"
              ),
              example: {
                message: t(
                  "categories.files.endpoints.presignFile.responses.400.example.message"
                ),
              },
            },
            {
              status: 401,
              description: t(
                "categories.files.endpoints.presignFile.responses.401.description"
              ),
              example: {
                message: t(
                  "categories.files.endpoints.presignFile.responses.401.example.message"
                ),
              },
            },
            {
              status: 413,
              description: t(
                "categories.files.endpoints.presignFile.responses.413.description"
              ),
              example: {
                message: t(
                  "categories.files.endpoints.presignFile.responses.413.example.message"
                ),
              },
            },
          ],
        },
        // 업로드 완료 확인 (신규)
        {
          method: "POST",
          path: "/api/v1/projects/[projectId]/files/confirm",
          description: t("categories.files.endpoints.confirmFile.description"),
          auth: true,
          parameters: [
            {
              name: "projectId",
              type: "string",
              required: true,
              description: t(
                "categories.files.endpoints.confirmFile.parameters.projectId.description"
              ),
            },
          ],
          requestBody: {
            type: "object",
            properties: [
              {
                name: "fileId",
                type: "string",
                required: true,
                description: t(
                  "categories.files.endpoints.confirmFile.requestBody.properties.fileId.description"
                ),
              },
              {
                name: "objectName",
                type: "string",
                required: true,
                description: t(
                  "categories.files.endpoints.confirmFile.requestBody.properties.objectName.description"
                ),
              },
              {
                name: "fileName",
                type: "string",
                required: true,
                description: t(
                  "categories.files.endpoints.confirmFile.requestBody.properties.fileName.description"
                ),
              },
              {
                name: "contentType",
                type: "string",
                required: true,
                description: t(
                  "categories.files.endpoints.confirmFile.requestBody.properties.contentType.description"
                ),
              },
              {
                name: "fileSize",
                type: "number",
                required: true,
                description: t(
                  "categories.files.endpoints.confirmFile.requestBody.properties.fileSize.description"
                ),
              },
              {
                name: "variants",
                type: "array",
                required: false,
                description: t(
                  "categories.files.endpoints.confirmFile.requestBody.properties.variants.description"
                ),
              },
            ],
          },
          responses: [
            {
              status: 201,
              description: t(
                "categories.files.endpoints.confirmFile.responses.201.description"
              ),
              example: {
                message: "파일 업로드 완료",
                file: {
                  id: "file5678efgh",
                  name: "example.jpg",
                  mimeType: "image/jpeg",
                  isImage: true,
                  size: 102400,
                  variants: [
                    {
                      url: "https://example.com/image.jpg",
                      label: "original",
                      format: "jpeg",
                      width: 1920,
                      height: 1080,
                      size: 102400,
                    },
                  ],
                },
              },
            },
            {
              status: 400,
              description: t(
                "categories.files.endpoints.confirmFile.responses.400.description"
              ),
              example: {
                message: t(
                  "categories.files.endpoints.confirmFile.responses.400.example.message"
                ),
              },
            },
            {
              status: 401,
              description: t(
                "categories.files.endpoints.confirmFile.responses.401.description"
              ),
              example: {
                message: t(
                  "categories.files.endpoints.confirmFile.responses.401.example.message"
                ),
              },
            },
            {
              status: 404,
              description: t(
                "categories.files.endpoints.confirmFile.responses.404.description"
              ),
              example: {
                message: t(
                  "categories.files.endpoints.confirmFile.responses.404.example.message"
                ),
              },
            },
          ],
        },
        {
          method: "DELETE",
          path: "/api/v1/projects/[projectId]/files/[fileId]",
          description: t("categories.files.endpoints.deleteFile.description"),
          auth: true,
          parameters: [
            {
              name: "projectId",
              type: "string",
              required: true,
              description: t(
                "categories.files.endpoints.deleteFile.parameters.projectId.description"
              ),
            },
            {
              name: "fileId",
              type: "string",
              required: true,
              description: t(
                "categories.files.endpoints.deleteFile.parameters.fileId.description"
              ),
            },
          ],
          responses: [
            {
              status: 200,
              description: t(
                "categories.files.endpoints.deleteFile.responses.200.description"
              ),
              example: {
                message: t(
                  "categories.files.endpoints.deleteFile.responses.200.example.message"
                ),
              },
            },
            {
              status: 401,
              description: t(
                "categories.files.endpoints.deleteFile.responses.401.description"
              ),
              example: {
                message: t(
                  "categories.files.endpoints.deleteFile.responses.401.example.message"
                ),
              },
            },
            {
              status: 404,
              description: t(
                "categories.files.endpoints.deleteFile.responses.404.description"
              ),
              example: {
                message: t(
                  "categories.files.endpoints.deleteFile.responses.404.example.message"
                ),
              },
            },
            {
              status: 500,
              description: t(
                "categories.files.endpoints.deleteFile.responses.500.description"
              ),
              example: {
                message: t(
                  "categories.files.endpoints.deleteFile.responses.500.example.message"
                ),
              },
            },
          ],
        },
      ],
    },
  ];
};

export const apiDocsData = {}; // This will be removed or handled by the page.tsx
