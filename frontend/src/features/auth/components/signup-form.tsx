"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ARegisterUser } from "@/features/auth/actions";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthScreenHeader } from "@/features/auth/components/auth-screen-header";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";
import {
  buildSCreateUser,
  type CreateUserFormBody,
} from "@/features/auth/schemas/signup.schema";
import { ApiError } from "@/lib/api/api-error";
import { cn } from "@/lib/utils";
import { ErrorAlert } from "@/shared/components/error-alert";
import { FormField } from "@/shared/components/form-field";
import { PasswordInput } from "@/shared/components/password-input";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { Input } from "@/shared/components/ui/input";

export function SignupForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<unknown>(null);

  const t = useTranslations("auth.signup");
  const tVal = useTranslations("validation");

  const signupSchema = useMemo(
    () =>
      buildSCreateUser({
        nameRequired: tVal("nameRequired"),
        emailInvalid: tVal("emailInvalid"),
        passwordMin: tVal("passwordMin"),
        passwordsMismatch: tVal("passwordsMismatch"),
      }),
    [tVal],
  );

  const form = useForm<CreateUserFormBody>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <AuthCard
      className="max-w-lg"
      header={
        <AuthScreenHeader
          title={t("title")}
          description={t("description")}
        />
      }
      footer={
        <p className="text-center text-sm text-muted-foreground">
          {t("hasAccount")}{" "}
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "link", className: "h-auto p-0" }),
            )}
          >
            {t("loginLink")}
          </Link>
        </p>
      }
    >
      <form
        className="space-y-8"
        onSubmit={form.handleSubmit(async (values) => {
          setSubmitError(null);
          try {
            const result = await ARegisterUser({
              name: values.name,
              email: values.email,
              password: values.password,
            });
            if (result.ok) {
              toast.success(t("successToast"));
              router.replace(
                `/verify-email?email=${encodeURIComponent(values.email)}`,
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

        <div
          className="space-y-4"
          role="group"
          aria-labelledby="signup-profile-heading"
        >
          <h2
            id="signup-profile-heading"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {t("profileSection")}
          </h2>
          <div className="space-y-4">
            <FormField
              label={t("nameLabel")}
              htmlFor="name"
              required
              error={form.formState.errors.name?.message}
            >
              <Input
                id="name"
                autoComplete="name"
                autoFocus
                className="h-10"
                {...form.register("name")}
              />
            </FormField>

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
                className="h-10"
                {...form.register("email")}
              />
            </FormField>
          </div>
        </div>

        <div
          className="space-y-4 rounded-xl border border-border/50 bg-muted/25 p-4 sm:p-5"
          role="group"
          aria-labelledby="signup-password-heading"
        >
          <h2
            id="signup-password-heading"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {t("passwordSection")}
          </h2>
          <div className="space-y-4">
            <FormField
              label={t("passwordLabel")}
              htmlFor="password"
              required
              error={form.formState.errors.password?.message}
            >
              <>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  className="h-10"
                  aria-invalid={!!form.formState.errors.password}
                  {...form.register("password")}
                />
                <p className="text-xs text-muted-foreground">
                  {t("passwordHint")}
                </p>
              </>
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
                className="h-10"
                aria-invalid={!!form.formState.errors.confirmPassword}
                {...form.register("confirmPassword")}
              />
            </FormField>
          </div>
        </div>

        <AuthSubmitButton
          pending={form.formState.isSubmitting}
          idleLabel={t("submit")}
          pendingLabel={t("submitting")}
        />
      </form>
    </AuthCard>
  );
}
