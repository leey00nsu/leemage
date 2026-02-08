import { z } from "zod";
import {
  confirmRequestSchema,
  variantOptionSchema,
} from "@/lib/openapi/schemas/files";

export type ConfirmRequest = z.infer<typeof confirmRequestSchema>;

export type VariantOption = z.infer<typeof variantOptionSchema>;

export type ImageVariantData = {
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
  label: string;
};
