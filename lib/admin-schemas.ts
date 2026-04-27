import { z } from "zod";

export const announcementSchema = z.object({
  id: z.number().int().optional(),
  title: z.string().max(200).default(""),
  content: z
    .string()
    .max(2000)
    .refine(
      (v) => !/<script|<iframe|javascript:|on\w+\s*=/i.test(v),
      "스크립트 또는 위험 태그를 포함할 수 없습니다",
    )
    .default(""),
  is_visible: z.number().int().min(0).max(1),
  dismiss_duration: z.enum(["none", "day", "week", "forever"]).default("none"),
});

export const caseCreateSchema = z.object({
  title: z.string().max(200).default(""),
  sort_order: z.number().int().default(0),
  show_on_main: z.number().int().min(0).max(3).default(1),
});

export const caseUpdateSchema = z.object({
  id: z.number().int(),
  title: z.string().max(200).optional(),
  sort_order: z.number().int().optional(),
  show_on_main: z.number().int().min(0).max(3).optional(),
});

export const imagePostSchema = z.object({
  case_id: z.number().int(),
  type: z.string(),
  image_url: z
    .string()
    .regex(/^(\/api\/uploads\/[\w.-]+|https?:\/\/.+)$/, "잘못된 image_url 형식")
    .optional(),
  is_starred: z.number().int().min(0).max(1).optional(),
});

export const imageSlotSchema = z.object({
  id: z.number().int(),
  slot_position: z.number().int().min(0).max(4).optional(),
  match_order: z.number().int().optional(),
  is_starred: z.number().int().min(0).max(1).optional(),
  image_url: z
    .string()
    .regex(/^(\/api\/uploads\/[\w.-]+|https?:\/\/.+)$/, "잘못된 image_url 형식")
    .optional(),
  image_url_wm: z
    .string()
    .regex(
      /^(\/api\/uploads\/[\w.-]+|https?:\/\/.+)$/,
      "잘못된 image_url_wm 형식",
    )
    .optional(),
});

export const configUpdateSchema = z.record(z.string(), z.unknown());
