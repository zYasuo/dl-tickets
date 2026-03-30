"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/components/auth-provider";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";
import { SLogin, type LoginFormValues } from "@/features/auth/schemas/login.schema";
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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<unknown>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(SLogin),
    defaultValues: { email: "", password: "" },
  });

  const next = searchParams.get("next") ?? "/tickets";

  return (
    <AuthCard
      header={
        <>
          <CardTitle className="text-xl font-semibold">Entrar</CardTitle>
          <CardDescription>
            Insere as tuas credenciais para continuar
          </CardDescription>
        </>
      }
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Não tens conta?{" "}
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ variant: "link", className: "h-auto p-0" }),
            )}
          >
            Criar conta
          </Link>
        </p>
      }
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          setSubmitError(null);
          try {
            await login(values.email, values.password);
            toast.success("Sessão iniciada.");
            router.replace(next.startsWith("/") ? next : "/tickets");
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

        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Link
              href="/forgot-password"
              className={cn(
                buttonVariants({
                  variant: "link",
                  size: "sm",
                  className: "h-auto p-0 text-xs text-muted-foreground",
                }),
              )}
            >
              Esqueci a password
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={!!form.formState.errors.password}
            {...form.register("password")}
          />
          {form.formState.errors.password?.message ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>

        <AuthSubmitButton
          pending={form.formState.isSubmitting}
          idleLabel="Entrar"
          pendingLabel="A entrar…"
        />
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">…</div>}>
      <LoginForm />
    </Suspense>
  );
}
