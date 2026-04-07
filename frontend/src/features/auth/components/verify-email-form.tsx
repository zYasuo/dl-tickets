"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Mail } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  AResendEmailVerification,
  AVerifyEmail,
} from "@/features/auth/actions";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthScreenHeader } from "@/features/auth/components/auth-screen-header";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";
import {
  buildSVerifyEmail,
  type VerifyEmailBody,
} from "@/features/auth/schemas/verify-email.schema";
import { ApiError } from "@/lib/api/api-error";
import { formatApiErrorForUser } from "@/lib/api/format-api-error-for-user";
import { cn } from "@/lib/utils";
import { ErrorAlert } from "@/shared/components/error-alert";
import { FormField } from "@/shared/components/form-field";
import { Button } from "@/shared/components/ui/button";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/shared/components/ui/input-otp";

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email")?.trim() ?? "";

  const [submitError, setSubmitError] = useState<unknown>(null);
  const [resendPending, setResendPending] = useState(false);

  const t = useTranslations("auth.verifyEmail");
  const tVal = useTranslations("validation");
  const tApi = useTranslations("errors.api");

  const verifySchema = useMemo(
    () =>
      buildSVerifyEmail({
        emailInvalid: tVal("emailInvalid"),
        verifyCodeDigits: tVal("verifyCodeDigits"),
      }),
    [tVal],
  );

  const form = useForm<VerifyEmailBody>({
    resolver: zodResolver(verifySchema),
    defaultValues: { email: emailParam, code: "" },
  });

  useEffect(() => {
    if (emailParam) {
      form.setValue("email", emailParam);
    }
  }, [emailParam, form.setValue]);

  if (!emailParam) {
    return (
      <AuthCard
        header={
          <AuthScreenHeader
            title={t("missingEmailTitle")}
            description={t("missingEmailDescription")}
          />
        }
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
            <Link
              href="/signup"
              className={cn(buttonVariants({ className: "w-full sm:w-auto" }))}
            >
              {t("createAccount")}
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className: "w-full sm:w-auto",
                }),
              )}
            >
              {t("login")}
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <AuthCard
      header={
        <AuthScreenHeader
          title={t("title")}
          description={
            <>
              {t("descriptionBefore")}{" "}
              <span className="break-all font-mono text-[0.8125rem] font-medium text-foreground">
                {emailParam}
              </span>
              {t("descriptionAfter")}
            </>
          }
          adornment={
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
              <Mail className="size-6" aria-hidden />
            </span>
          }
        />
      }
      footer={
        <p className="text-center text-sm text-muted-foreground">
          {t("alreadyVerified")}{" "}
          <Link
            href={`/login?email=${encodeURIComponent(emailParam)}`}
            className={cn(
              buttonVariants({ variant: "link", className: "h-auto p-0" }),
            )}
          >
            {t("goToLogin")}
          </Link>
        </p>
      }
    >
      <form
        className="space-y-6"
        onSubmit={form.handleSubmit(async (values) => {
          setSubmitError(null);
          try {
            const result = await AVerifyEmail(values.email, values.code);
            if (result.ok) {
              toast.success(t("successToast"));
              router.replace(
                `/login?email=${encodeURIComponent(values.email)}`,
              );
              return;
            }
            setSubmitError(ApiError.fromFields(result));
          } catch (e) {
            setSubmitError(e);
          }
        })}
      >
        {submitError ? <ErrorAlert error={submitError} /> : null}

        <input type="hidden" {...form.register("email")} />

        <FormField
          label={t("codeLabel")}
          htmlFor="code"
          required
          error={form.formState.errors.code?.message}
        >
          <Controller
            control={form.control}
            name="code"
            render={({ field, fieldState }) => (
              <InputOTP
                id="code"
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                disabled={form.formState.isSubmitting}
                aria-invalid={fieldState.invalid}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                containerClassName="flex w-full flex-wrap items-center justify-center gap-2 sm:justify-start"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            )}
          />
        </FormField>

        <div className="flex flex-col gap-3 pt-1">
          <AuthSubmitButton
            pending={form.formState.isSubmitting}
            idleLabel={t("submit")}
            pendingLabel={t("submitting")}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={resendPending}
            onClick={async () => {
              setResendPending(true);
              try {
                const result = await AResendEmailVerification(emailParam);
                if (result.ok) {
                  toast.success(t("resendSuccessToast"));
                } else {
                  toast.error(
                    formatApiErrorForUser(ApiError.fromFields(result), tApi),
                  );
                }
              } finally {
                setResendPending(false);
              }
            }}
          >
            {resendPending ? t("resending") : t("resend")}
          </Button>
        </div>
      </form>
    </AuthCard>
  );
}
