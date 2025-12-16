export type ApiEndpoint = {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string;
  auth: boolean;
  deprecated?: boolean;
  parameters?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  requestBody?: {
    type: string;
    properties: {
      name: string;
      type: string;
      required: boolean;
      description: string;
    }[];
  };
  responses: {
    status: number;
    description: string;
    example: unknown;
  }[];
};

export type ApiCategory = {
  name: string;
  description: string;
  endpoints: ApiEndpoint[];
};
