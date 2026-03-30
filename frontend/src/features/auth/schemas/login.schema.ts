import { z } from "zod";

export const SLogin = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof SLogin>;
