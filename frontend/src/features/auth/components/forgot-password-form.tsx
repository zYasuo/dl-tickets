"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { MailCheck } from "lucide-react";
import { ARequestPasswordReset } from "@/features/auth/actions";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";
import {
  buildSRequestPasswordReset,
  type RequestPasswordResetBody,
} from "@/features/auth/schemas/forgot-password.schema";
import { ApiError } from "@/lib/api/api-error";
import { cn } from "@/lib/utils";
import { ErrorAlert } from "@/shared/components/error-alert";
import { FormField } from "@/shared/components/form-field";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import {
  CardDescription,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";

export function ForgotPasswordForm() {
  const [phase, setPhase] = useState<"form" | "success">("form");
  const [submitError, setSubmitError] = useState<unknown>(null);

  const t = useTranslations("auth.forgotPassword");
  const tVal = useTranslations("validation");

  const schema = useMemo(
    () =>
      buildSRequestPasswordReset({
        emailInvalid: tVal("emailInvalid"),
      }),
    [tVal],
  );

  const form = useForm<RequestPasswordResetBody>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  if (phase === "success") {
    return (
      <AuthCard
        header={
          <div className="flex flex-col items-center gap-3 text-center">
            <MailCheck className="size-10 text-primary" aria-hidden />
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
            {t("backToLogin")}
          </Link>
        }
      />
    );
  }

  return (
    <AuthCard
      header={
        <>
          <CardTitle className="text-xl font-semibold">
            {t("title")}
          </CardTitle>
          <CardDescription>
            {t("description")}
          </CardDescription>
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
            const result = await ARequestPasswordReset(values.email);
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
            {...form.register("email")}
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
