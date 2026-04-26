import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username max 20 characters")
    .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores")
    .trim(),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  institution: z.string().min(2, "Institution is required").trim(),
  year: z.string().min(1, "Year is required"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});
