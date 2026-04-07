import { z } from "zod";

export type BuildSLoginParams = {
  emailInvalid: string;
  passwordRequired: string;
};

export function buildSLogin(params: BuildSLoginParams) {
  return z.object({
    email: z.email(params.emailInvalid),
    password: z.string().min(1, params.passwordRequired),
  });
}

export type LoginBody = z.infer<ReturnType<typeof buildSLogin>>;
