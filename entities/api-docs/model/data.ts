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
                images: [
                  {
                    id: "img1234abcd",
                    name: t(
                      "categories.projects.endpoints.getProjectById.responses.200.example.images.0.name"
                    ),
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
      name: t("categories.images.name"),
      description: t("categories.images.description"),
      endpoints: [
        {
          method: "POST",
          path: "/api/v1/projects/[projectId]/images",
          description: t("categories.images.endpoints.uploadImage.description"),
          auth: true,
          parameters: [
            {
              name: "projectId",
              type: "string",
              required: true,
              description: t(
                "categories.images.endpoints.uploadImage.parameters.projectId.description"
              ),
            },
          ],
          requestBody: {
            type: "multipart/form-data",
            properties: [
              {
                name: "file",
                type: "file",
                required: true,
                description: t(
                  "categories.images.endpoints.uploadImage.requestBody.properties.file.description"
                ),
              },
              {
                name: "variants",
                type: "json array",
                required: true,
                description: t(
                  "categories.images.endpoints.uploadImage.requestBody.properties.variants.description"
                ),
              },
            ],
          },
          responses: [
            {
              status: 201,
              description: t(
                "categories.images.endpoints.uploadImage.responses.201.description"
              ),
              example: {
                id: "img1234abcd",
                name: "새 이미지.jpg",
                variants: [
                  {
                    id: "var1234abcd",
                    url: "https://example.com/image_300x300.jpg",
                    type: "300x300",
                  },
                ],
                createdAt: "2023-01-01T00:00:00.000Z",
                updatedAt: "2023-01-01T00:00:00.000Z",
                projectId: "clq1234abcd",
              },
            },
            {
              status: 400,
              description: t(
                "categories.images.endpoints.uploadImage.responses.400.description"
              ),
              example: {
                message: t(
                  "categories.images.endpoints.uploadImage.responses.400.example.message"
                ),
              },
            },
            {
              status: 401,
              description: t(
                "categories.images.endpoints.uploadImage.responses.401.description"
              ),
              example: {
                message: t(
                  "categories.images.endpoints.uploadImage.responses.401.example.message"
                ),
              },
            },
            {
              status: 404,
              description: t(
                "categories.images.endpoints.uploadImage.responses.404.description"
              ),
              example: {
                message: t(
                  "categories.images.endpoints.uploadImage.responses.404.example.message"
                ),
              },
            },
            {
              status: 500,
              description: t(
                "categories.images.endpoints.uploadImage.responses.500.description"
              ),
              example: {
                message: t(
                  "categories.images.endpoints.uploadImage.responses.500.example.message"
                ),
              },
            },
          ],
        },
        {
          method: "DELETE",
          path: "/api/v1/projects/[projectId]/images/[imageId]",
          description: t("categories.images.endpoints.deleteImage.description"),
          auth: true,
          parameters: [
            {
              name: "projectId",
              type: "string",
              required: true,
              description: t(
                "categories.images.endpoints.deleteImage.parameters.projectId.description"
              ),
            },
            {
              name: "imageId",
              type: "string",
              required: true,
              description: t(
                "categories.images.endpoints.deleteImage.parameters.imageId.description"
              ),
            },
          ],
          responses: [
            {
              status: 200,
              description: t(
                "categories.images.endpoints.deleteImage.responses.200.description"
              ),
              example: {
                message: t(
                  "categories.images.endpoints.deleteImage.responses.200.example.message"
                ),
              },
            },
            {
              status: 401,
              description: t(
                "categories.images.endpoints.deleteImage.responses.401.description"
              ),
              example: {
                message: t(
                  "categories.images.endpoints.deleteImage.responses.401.example.message"
                ),
              },
            },
            {
              status: 404,
              description: t(
                "categories.images.endpoints.deleteImage.responses.404.description"
              ),
              example: {
                message: t(
                  "categories.images.endpoints.deleteImage.responses.404.example.message"
                ),
              },
            },
            {
              status: 500,
              description: t(
                "categories.images.endpoints.deleteImage.responses.500.description"
              ),
              example: {
                message: t(
                  "categories.images.endpoints.deleteImage.responses.500.example.message"
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
