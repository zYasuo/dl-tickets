import { z } from "zod";

export type BuildSCreateUserParams = {
  nameRequired: string;
  emailInvalid: string;
  passwordMin: string;
  passwordsMismatch: string;
};

export function buildSCreateUser(params: BuildSCreateUserParams) {
  return z
    .object({
      name: z.string().min(1, params.nameRequired).max(255),
      email: z.email(params.emailInvalid).max(254),
      password: z.string().min(8, params.passwordMin).max(255),
      confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: params.passwordsMismatch,
      path: ["confirmPassword"],
    });
}

export type CreateUserFormBody = z.infer<ReturnType<typeof buildSCreateUser>>;
