"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ARegisterUser } from "@/features/auth/actions";
import { useAuth } from "@/features/auth/components/auth-provider";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";
import { SSignup, type SignupFormValues } from "@/features/auth/schemas/signup.schema";
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

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<unknown>(null);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(SSignup),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <AuthCard
      header={
        <>
          <CardTitle className="text-xl font-semibold">Criar conta</CardTitle>
          <CardDescription>
            Preenche os dados para te registares
          </CardDescription>
        </>
      }
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Já tens conta?{" "}
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "link", className: "h-auto p-0" }),
            )}
          >
            Entrar
          </Link>
        </p>
      }
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          setSubmitError(null);
          try {
            await ARegisterUser({
              name: values.name,
              email: values.email,
              password: values.password,
            });
            try {
              await login(values.email, values.password);
              toast.success("Conta criada. Bem-vindo(a)!");
              router.replace("/tickets");
            } catch {
              toast.error(
                "Conta criada, mas o início de sessão falhou. Entra manualmente.",
              );
              router.replace("/login");
            }
          } catch (e) {
            setSubmitError(e);
          }
        })}
      >
        {submitError ? <ErrorAlert error={submitError} /> : null}

        <FormField
          label="Nome"
          htmlFor="name"
          required
          error={form.formState.errors.name?.message}
        >
          <Input
            id="name"
            autoComplete="name"
            autoFocus
            {...form.register("name")}
          />
        </FormField>

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
            {...form.register("email")}
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="password"
          required
          error={form.formState.errors.password?.message}
        >
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={!!form.formState.errors.password}
            {...form.register("password")}
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
          idleLabel="Criar conta"
          pendingLabel="A criar…"
        />
      </form>
    </AuthCard>
  );
}
