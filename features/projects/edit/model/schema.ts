import { z } from "zod";

export const editProjectSchema = z.object({
  name: z
    .string()
    .min(1, { message: "프로젝트 이름은 필수입니다." })
    .max(50, { message: "프로젝트 이름은 50자를 초과할 수 없습니다." }),
  description: z
    .string()
    .max(200, { message: "설명은 200자를 초과할 수 없습니다." })
    .optional(),
});

export type EditProjectFormValues = z.infer<typeof editProjectSchema>;
