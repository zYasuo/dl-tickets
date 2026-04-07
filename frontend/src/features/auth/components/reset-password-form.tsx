"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ShieldCheck } from "lucide-react";
import { AConfirmPasswordReset } from "@/features/auth/actions";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";
import {
  buildSResetPasswordForm,
  type ResetPasswordFormBody,
} from "@/features/auth/schemas/reset-password.schema";
import { ApiError } from "@/lib/api/api-error";
import { cn } from "@/lib/utils";
import { ErrorAlert } from "@/shared/components/error-alert";
import { FormField } from "@/shared/components/form-field";
import { PasswordInput } from "@/shared/components/password-input";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import {
  CardDescription,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token")?.trim() ?? "";
  const [phase, setPhase] = useState<"form" | "success">("form");
  const [submitError, setSubmitError] = useState<unknown>(null);

  const t = useTranslations("auth.resetPassword");
  const tVal = useTranslations("validation");

  const schema = useMemo(
    () =>
      buildSResetPasswordForm({
        tokenRequired: tVal("tokenRequired"),
        passwordMin: tVal("passwordMin"),
        passwordsMismatch: tVal("passwordsMismatch"),
      }),
    [tVal],
  );

  const form = useForm<ResetPasswordFormBody>({
    resolver: zodResolver(schema),
    defaultValues: {
      token: tokenFromUrl,
      newPassword: "",
      confirmPassword: "",
    },
  });

  const showTokenField = !tokenFromUrl;

  if (phase === "success") {
    return (
      <AuthCard
        header={
          <div className="flex flex-col items-center gap-3 text-center">
            <ShieldCheck className="size-10 text-primary" aria-hidden />
            <CardTitle className="text-xl font-semibold">
              {t("successTitle")}
            </CardTitle>
            <CardDescription className="text-center">
              {t("successDescription")}
            </CardDescription>
          </div>
        }
        footer={
          <Link
            href="/login"
            className={cn(buttonVariants({ className: "w-full" }))}
          >
            {t("goToLogin")}
          </Link>
        }
      />
    );
  }

  return (
    <AuthCard
      header={
        <>
          <CardTitle className="text-xl font-semibold">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </>
      }
      footer={
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "link", className: "h-auto p-0" }),
          )}
        >
          {t("backToLogin")}
        </Link>
      }
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          setSubmitError(null);
          try {
            const result = await AConfirmPasswordReset(
              values.token,
              values.newPassword,
            );
            if (result.ok) {
              setPhase("success");
              return;
            }
            setSubmitError(ApiError.fromFields(result));
          } catch (e) {
            setSubmitError(e);
          }
        })}
      >
        {submitError ? <ErrorAlert error={submitError} /> : null}

        {showTokenField ? (
          <FormField
            label={t("tokenLabel")}
            htmlFor="token"
            required
            error={form.formState.errors.token?.message}
          >
            <Input
              id="token"
              placeholder={t("tokenPlaceholder")}
              autoComplete="off"
              autoFocus
              {...form.register("token")}
            />
          </FormField>
        ) : (
          <Controller
            name="token"
            control={form.control}
            render={({ field }) => <input type="hidden" {...field} />}
          />
        )}

        <FormField
          label={t("newPasswordLabel")}
          htmlFor="newPassword"
          required
          error={form.formState.errors.newPassword?.message}
        >
          <PasswordInput
            id="newPassword"
            autoComplete="new-password"
            autoFocus={!showTokenField}
            aria-invalid={!!form.formState.errors.newPassword}
            {...form.register("newPassword")}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t("newPasswordHint")}
          </p>
        </FormField>

        <FormField
          label={t("confirmPasswordLabel")}
          htmlFor="confirmPassword"
          required
          error={form.formState.errors.confirmPassword?.message}
        >
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            aria-invalid={!!form.formState.errors.confirmPassword}
            {...form.register("confirmPassword")}
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
