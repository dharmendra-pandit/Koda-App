import { z } from "zod";

export const searchSchema = z.object({
  query: z
    .string()
    .min(2, "Search query must be at least 2 characters")
    .max(50, "Query too long")
    .trim(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).trim().optional(),
  bio: z.string().max(200).optional(),
  institution: z.string().min(2).trim().optional(),
  year: z.string().optional(),
  isPublic: z.boolean().optional(),
});
