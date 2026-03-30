import { z } from "zod";

export const SForgotPassword = z.object({
  email: z.string().email("Invalid email"),
});

export type ForgotPasswordFormValues = z.infer<typeof SForgotPassword>;
