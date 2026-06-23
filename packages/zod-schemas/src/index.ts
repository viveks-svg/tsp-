import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const SignupSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["USER", "ASTROLOGER", "ADMIN"]).default("USER"),
});

export const BookConsultationSchema = z.object({
  astrologerId: z.string().uuid("Invalid astrologer ID"),
  scheduledAt: z.string().datetime("Invalid date format"),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;
export type BookConsultationInput = z.infer<typeof BookConsultationSchema>;
