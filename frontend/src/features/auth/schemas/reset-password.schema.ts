import { z } from "zod";

export type BuildSResetPasswordFormParams = {
  tokenRequired: string;
  passwordMin: string;
  passwordsMismatch: string;
};

export function buildSResetPasswordForm(params: BuildSResetPasswordFormParams) {
  return z
    .object({
      token: z.string().min(1, params.tokenRequired),
      newPassword: z.string().min(8, params.passwordMin).max(255),
      confirmPassword: z.string(),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
      message: params.passwordsMismatch,
      path: ["confirmPassword"],
    });
}

export type ResetPasswordFormBody = z.infer<
  ReturnType<typeof buildSResetPasswordForm>
>;
