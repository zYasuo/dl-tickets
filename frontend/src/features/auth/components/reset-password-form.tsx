"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ShieldCheck } from "lucide-react";
import { AConfirmPasswordReset } from "@/features/auth/actions";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";
import {
  SResetPassword,
  type ResetPasswordFormValues,
} from "@/features/auth/schemas/reset-password.schema";
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

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(SResetPassword),
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
              Password atualizada
            </CardTitle>
            <CardDescription className="text-center">
              Podes agora entrar com a tua nova password.
            </CardDescription>
          </div>
        }
        footer={
          <Link
            href="/login"
            className={cn(buttonVariants({ className: "w-full" }))}
          >
            Ir para o login
          </Link>
        }
      />
    );
  }

  return (
    <AuthCard
      header={
        <>
          <CardTitle className="text-xl font-semibold">Nova password</CardTitle>
          <CardDescription>Define a tua nova password</CardDescription>
        </>
      }
      footer={
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "link", className: "h-auto p-0" }),
          )}
        >
          Voltar ao login
        </Link>
      }
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          setSubmitError(null);
          try {
            await AConfirmPasswordReset(values.token, values.newPassword);
            setPhase("success");
          } catch (e) {
            setSubmitError(e);
          }
        })}
      >
        {submitError ? <ErrorAlert error={submitError} /> : null}

        {showTokenField ? (
          <FormField
            label="Token"
            htmlFor="token"
            required
            error={form.formState.errors.token?.message}
          >
            <Input
              id="token"
              placeholder="Cola o token recebido por email"
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
          label="Nova password"
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
            Mínimo 8 caracteres
          </p>
        </FormField>

        <FormField
          label="Confirmar password"
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
          idleLabel="Alterar password"
          pendingLabel="A atualizar…"
        />
      </form>
    </AuthCard>
  );
}
