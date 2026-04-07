import { z } from "zod";

export type BuildSRequestPasswordResetParams = {
  emailInvalid: string;
};

export function buildSRequestPasswordReset(params: BuildSRequestPasswordResetParams) {
  return z.object({
    email: z.email(params.emailInvalid),
  });
}

export type RequestPasswordResetBody = z.infer<
  ReturnType<typeof buildSRequestPasswordReset>
>;
