import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(3, { message: "프로젝트 이름은 3자 이상이어야 합니다." })
    .max(50, { message: "프로젝트 이름은 50자를 초과할 수 없습니다." }),
  description: z
    .string()
    .max(200, { message: "설명은 200자를 초과할 수 없습니다." })
    .optional(), // 설명은 선택 사항
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;
