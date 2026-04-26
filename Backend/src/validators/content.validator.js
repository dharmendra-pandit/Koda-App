import { z } from "zod";

export const subjectSchema = z.object({
  title: z.string().min(1, "Title is required").max(100).trim(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color")
    .optional()
    .default("#6C63FF"),
  isPublic: z.boolean().optional().default(false),
});

export const chapterSchema = z.object({
  subjectId: z.string().min(1, "Subject ID is required"),
  title: z.string().min(1, "Title is required").max(200).trim(),
  isCompleted: z.boolean().optional().default(false),
});

export const sessionSchema = z.object({
  subjectId: z.string().optional(),  // timer screen has optional subject picker
  chapterId: z.string().optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  date: z.string().optional(),
});

export const doubtSchema = z.object({
  subjectId: z.string().optional(),   // mobile community tab has no subject picker
  chapterId: z.string().optional(),
  title: z.string().min(3, "Title must be at least 3 characters").max(200).trim(),
  description: z.string().max(2000).optional().default(""), // optional in mobile form
});

export const replySchema = z.object({
  doubtId: z.string().min(1, "Doubt ID is required"),
  text: z.string().min(1, "Reply text is required"),
});
