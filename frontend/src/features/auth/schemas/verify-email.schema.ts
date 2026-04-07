import { z } from "zod";

export type BuildSVerifyEmailParams = {
  emailInvalid: string;
  verifyCodeDigits: string;
};

export function buildSVerifyEmail(params: BuildSVerifyEmailParams) {
  return z.object({
    email: z.email(params.emailInvalid).max(254),
    code: z.string().regex(/^\d{6}$/, params.verifyCodeDigits),
  });
}

export type VerifyEmailBody = z.infer<ReturnType<typeof buildSVerifyEmail>>;
