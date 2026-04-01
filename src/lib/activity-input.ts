import { Category } from "@prisma/client";
import { z } from "zod";

export const activityInputSchema = z.object({
  category: z.nativeEnum(Category),
  subcategory: z.string().min(1),
  value: z.coerce.number().positive(),
  unit: z.string().min(1),
  date: z.string().datetime().or(z.string().min(10)),
  facility: z.string().optional(),
  note: z.string().optional(),
  source: z.enum(["MANUAL", "OCR", "API"]).optional(),
});

export type ActivityInput = z.infer<typeof activityInputSchema>;
