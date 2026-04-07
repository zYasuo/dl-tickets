"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/components/auth-provider";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthScreenHeader } from "@/features/auth/components/auth-screen-header";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";
import {
  buildSLogin,
  type LoginBody,
} from "@/features/auth/schemas/login.schema";
import { AUTH_API_ERROR_CODES } from "@/lib/api/api-error-codes";
import { ApiError } from "@/lib/api/api-error";
import { cn } from "@/lib/utils";
import { ErrorAlert } from "@/shared/components/error-alert";
import { FormField } from "@/shared/components/form-field";
import { PasswordInput } from "@/shared/components/password-input";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { Input } from "@/shared/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<unknown>(null);

  const t = useTranslations("auth.login");
  const tVal = useTranslations("validation");
  const loginSchema = useMemo(
    () =>
      buildSLogin({
        emailInvalid: tVal("emailInvalid"),
        passwordRequired: tVal("passwordRequired"),
      }),
    [tVal],
  );

  const form = useForm<LoginBody>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const emailParam = searchParams.get("email");
  useEffect(() => {
    if (emailParam) {
      form.setValue("email", emailParam);
    }
  }, [emailParam, form.setValue]);

  const next = searchParams.get("next") ?? "/dashboard";

  return (
    <AuthCard
      header={
        <AuthScreenHeader
          title={t("title")}
          description={t("description")}
        />
      }
      footer={
        <p className="text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ variant: "link", className: "h-auto p-0" }),
            )}
          >
            {t("createAccountLink")}
          </Link>
        </p>
      }
    >
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit(async (values) => {
          setSubmitError(null);
          try {
            const result = await login(values.email, values.password);
            if (result.ok) {
              toast.success(t("successToast"));
              router.replace(next.startsWith("/") ? next : "/dashboard");
              return;
            }
            if (result.code === AUTH_API_ERROR_CODES.EMAIL_NOT_VERIFIED) {
              toast.info(t("verifyEmailRedirectToast"));
              router.replace(
                `/verify-email?email=${encodeURIComponent(values.email)}`,
              );
              return;
            }
            setSubmitError(
              ApiError.fromFields({
                statusCode: result.statusCode,
                message: result.message,
                code: result.code,
              }),
            );
          } catch (e) {
            setSubmitError(e);
          }
        })}
      >
        {submitError ? <ErrorAlert error={submitError} /> : null}

        <FormField
          label={t("emailLabel")}
          htmlFor="email"
          required
          error={form.formState.errors.email?.message}
        >
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            className="h-10"
            {...form.register("email")}
          />
        </FormField>

        <FormField
          label={t("passwordLabel")}
          htmlFor="password"
          required
          error={form.formState.errors.password?.message}
          labelTrailing={
            <Link
              href="/forgot-password"
              className={cn(
                buttonVariants({
                  variant: "link",
                  size: "sm",
                  className:
                    "h-auto shrink-0 p-0 text-xs font-normal text-muted-foreground underline-offset-4 hover:text-foreground",
                }),
              )}
            >
              {t("forgotPassword")}
            </Link>
          }
        >
          <PasswordInput
            id="password"
            autoComplete="current-password"
            className="h-10"
            aria-invalid={!!form.formState.errors.password}
            {...form.register("password")}
          />
        </FormField>

        <AuthSubmitButton
          pending={form.formState.isSubmitting}
          idleLabel={t("submit")}
          pendingLabel={t("submitting")}
        />
      </form>
    </AuthCard>
  );
}
