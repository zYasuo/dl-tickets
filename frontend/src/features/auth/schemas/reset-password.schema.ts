import { z } from "zod";

export const SResetPassword = z
  .object({
    token: z.string().min(1, "Token is required"),
    newPassword: z.string().min(8, "At least 8 characters").max(255),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof SResetPassword>;
