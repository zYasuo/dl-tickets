import { z } from "zod";

export const SSignup = z
  .object({
    name: z.string().min(1, "Name is required").max(255),
    email: z.string().email("Invalid email").max(254),
    password: z.string().min(8, "At least 8 characters").max(255),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupFormValues = z.infer<typeof SSignup>;
