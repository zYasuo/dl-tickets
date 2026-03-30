"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { MailCheck } from "lucide-react";
import { ARequestPasswordReset } from "@/features/auth/actions";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";
import {
  SForgotPassword,
  type ForgotPasswordFormValues,
} from "@/features/auth/schemas/forgot-password.schema";
import { cn } from "@/lib/utils";
import { ErrorAlert } from "@/shared/components/error-alert";
import { FormField } from "@/shared/components/form-field";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import {
  CardDescription,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";

export default function ForgotPasswordPage() {
  const [phase, setPhase] = useState<"form" | "success">("form");
  const [submitError, setSubmitError] = useState<unknown>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(SForgotPassword),
    defaultValues: { email: "" },
  });

  if (phase === "success") {
    return (
      <AuthCard
        header={
          <div className="flex flex-col items-center gap-3 text-center">
            <MailCheck className="size-10 text-primary" aria-hidden />
            <CardTitle className="text-xl font-semibold">Email enviado</CardTitle>
            <CardDescription className="text-center">
              Se existir uma conta com esse email, receberás instruções para
              redefinir a password.
            </CardDescription>
          </div>
        }
        footer={
          <Link
            href="/login"
            className={cn(buttonVariants({ className: "w-full" }))}
          >
            Voltar ao login
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
            Recuperar password
          </CardTitle>
          <CardDescription>
            Indica o teu email e enviamos instruções de recuperação
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
          Voltar ao login
        </Link>
      }
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          setSubmitError(null);
          try {
            await ARequestPasswordReset(values.email);
            setPhase("success");
          } catch (e) {
            setSubmitError(e);
          }
        })}
      >
        {submitError ? <ErrorAlert error={submitError} /> : null}

        <FormField
          label="Email"
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
          idleLabel="Enviar"
          pendingLabel="A enviar…"
        />
      </form>
    </AuthCard>
  );
}
