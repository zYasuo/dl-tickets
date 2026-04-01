"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { CreateClientBody } from "@/features/clients/actions";
import { useCreateClient } from "@/features/clients/hooks/use-create-client";
import {
  createClientFormSchema,
  type CreateClientFormValues,
} from "@/features/clients/schemas/client.schema";
import { cn } from "@/lib/utils";
import { ErrorAlert } from "@/shared/components/error-alert";
import { FormField } from "@/shared/components/form-field";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Separator } from "@/shared/components/ui/separator";

function toCreateBody(values: CreateClientFormValues): CreateClientBody {
  const comp = values.address.complement?.trim();
  const address = {
    street: values.address.street.trim(),
    number: values.address.number.trim(),
    neighborhood: values.address.neighborhood.trim(),
    city: values.address.city.trim(),
    state: values.address.state,
    zipCode: values.address.zipCode.trim(),
    ...(comp ? { complement: comp } : {}),
  };

  const isForeignNational = values.foreignNational;

  if (isForeignNational) {
    return {
      name: values.name.trim(),
      cnpj: values.cnpj!.trim(),
      address,
      isForeignNational: true,
    };
  }

  if (values.documentKind === "cpf") {
    return {
      name: values.name.trim(),
      cpf: values.cpf!.trim(),
      address,
      isForeignNational: false,
    };
  }

  return {
    name: values.name.trim(),
    cnpj: values.cnpj!.trim(),
    address,
    isForeignNational: false,
  };
}

type DocKind = "cpf" | "cnpj";

export function ClientCreateForm() {
  const router = useRouter();
  const mutation = useCreateClient();

  const form = useForm<CreateClientFormValues>({
    resolver: zodResolver(createClientFormSchema),
    defaultValues: {
      foreignNational: false,
      documentKind: "cpf",
      name: "",
      cpf: "",
      cnpj: "",
      address: {
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        zipCode: "",
      },
    },
  });

  const documentKind = form.watch("documentKind");
  const foreignNational = form.watch("foreignNational");

  const setDocumentKind = (kind: DocKind) => {
    form.setValue("documentKind", kind);
    if (kind === "cpf") {
      form.setValue("cnpj", "");
    } else {
      form.setValue("cpf", "");
    }
    void form.clearErrors(["cpf", "cnpj"]);
  };

  return (
    <div className="w-full rounded-xl border border-border/80 bg-card/50 p-5 shadow-sm ring-1 ring-foreground/5 sm:p-6">
      <div className="mb-5 space-y-1">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          Identificação
        </h2>
        <p className="text-sm text-muted-foreground">
          CPF só para quem não é estrangeiro. Estrangeiros usam CNPJ (ex.:
          empresa).
        </p>
      </div>

      <form
        className="w-full space-y-6"
        onSubmit={form.handleSubmit((values) => {
          mutation.mutate(toCreateBody(values), {
            onSuccess: () => {
              toast.success("Cliente criado");
              void router.push("/dashboard/clients");
            },
          });
        })}
      >
        {mutation.isError ? <ErrorAlert error={mutation.error} /> : null}

        <FormField
          label="Nome ou razão social"
          htmlFor="client-name"
          required
          error={form.formState.errors.name?.message}
        >
          <Input
            id="client-name"
            autoComplete="organization"
            autoFocus
            placeholder="Ex.: Maria Silva ou Empresa Lda."
            className="h-10 w-full"
            {...form.register("name")}
          />
        </FormField>

        <Controller
          name="foreignNational"
          control={form.control}
          render={({ field }) => (
            <div className="flex flex-col gap-2">
              <label className="flex max-w-full cursor-pointer items-start gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-3 sm:items-center">
                <input
                  type="checkbox"
                  ref={field.ref}
                  name={field.name}
                  onBlur={field.onBlur}
                  className="mt-0.5 size-4 shrink-0 rounded border-border accent-primary sm:mt-0"
                  checked={field.value ?? false}
                  onChange={(e) => {
                    const next = e.target.checked;
                    field.onChange(next);
                    if (next) {
                      form.setValue("documentKind", "cnpj");
                      form.setValue("cpf", "");
                      void form.clearErrors(["cpf", "cnpj"]);
                    }
                  }}
                  aria-describedby="foreign-national-hint"
                />
                <span className="min-w-0 text-sm leading-snug">
                  <span className="font-medium text-foreground">
                    Cliente estrangeiro
                  </span>
                  <span id="foreign-national-hint" className="block text-muted-foreground">
                    Sem CPF brasileiro — indica apenas CNPJ.
                  </span>
                </span>
              </label>
            </div>
          )}
        />

        <div className="flex w-full flex-col gap-2">
          <span
            id="documento-label"
            className="text-sm font-medium leading-none text-foreground"
          >
            Documento <span className="text-destructive">*</span>
          </span>

          {!foreignNational ? (
            <div
              className="flex w-full flex-col gap-3"
              role="group"
              aria-labelledby="documento-label"
            >
              <div className="inline-flex w-full max-w-md rounded-lg border border-border/80 bg-muted/40 p-1 sm:w-fit">
                {(
                  [
                    { kind: "cpf" as const, label: "CPF" },
                    { kind: "cnpj" as const, label: "CNPJ" },
                  ] as const
                ).map(({ kind, label }) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setDocumentKind(kind)}
                    className={cn(
                      "min-h-9 flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:flex-none",
                      documentKind === kind
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {documentKind === "cpf" ? (
                <FormField
                  label="CPF"
                  htmlFor="client-cpf"
                  required
                  error={form.formState.errors.cpf?.message}
                >
                  <Input
                    id="client-cpf"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="000.000.000-00"
                    className="h-10 w-full font-mono text-sm"
                    {...form.register("cpf")}
                  />
                </FormField>
              ) : (
                <FormField
                  label="CNPJ"
                  htmlFor="client-cnpj"
                  required
                  error={form.formState.errors.cnpj?.message}
                >
                  <Input
                    id="client-cnpj"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="00.000.000/0000-00"
                    className="h-10 w-full font-mono text-sm"
                    {...form.register("cnpj")}
                  />
                </FormField>
              )}
            </div>
          ) : (
            <div
              className="flex w-full flex-col gap-3"
              aria-labelledby="documento-label"
            >
              <FormField
                label="CNPJ"
                htmlFor="client-cnpj-foreign"
                required
                error={form.formState.errors.cnpj?.message}
              >
                <Input
                  id="client-cnpj-foreign"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="00.000.000/0000-00"
                  className="h-10 w-full font-mono text-sm"
                  {...form.register("cnpj")}
                />
              </FormField>
            </div>
          )}
        </div>

        <Separator className="bg-border/80" />

        <div className="w-full space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Morada
            </h3>
            <p className="text-sm text-muted-foreground">
              Rua, número, bairro, cidade, UF e CEP são obrigatórios.
              Complemento é opcional.
            </p>
          </div>

          <div className="grid w-full gap-4 sm:grid-cols-6">
            <FormField
              label="Rua ou logradouro"
              htmlFor="addr-street"
              required
              error={form.formState.errors.address?.street?.message}
              className="sm:col-span-6"
            >
              <Input
                id="addr-street"
                autoComplete="street-address"
                placeholder="Nome da rua, avenida…"
                className="h-10 w-full"
                {...form.register("address.street")}
              />
            </FormField>

            <FormField
              label="Número"
              htmlFor="addr-number"
              required
              error={form.formState.errors.address?.number?.message}
              className="sm:col-span-2"
            >
              <Input
                id="addr-number"
                autoComplete="off"
                placeholder="N.º"
                className="h-10 w-full"
                {...form.register("address.number")}
              />
            </FormField>
            <FormField
              label="Complemento"
              htmlFor="addr-complement"
              error={form.formState.errors.address?.complement?.message}
              className="sm:col-span-4"
            >
              <Input
                id="addr-complement"
                autoComplete="off"
                placeholder="Apartamento, bloco… (opcional)"
                className="h-10 w-full"
                {...form.register("address.complement")}
              />
            </FormField>

            <FormField
              label="Bairro"
              htmlFor="addr-neighborhood"
              required
              error={form.formState.errors.address?.neighborhood?.message}
              className="sm:col-span-3"
            >
              <Input
                id="addr-neighborhood"
                autoComplete="off"
                placeholder="Bairro"
                className="h-10 w-full"
                {...form.register("address.neighborhood")}
              />
            </FormField>
            <FormField
              label="Cidade"
              htmlFor="addr-city"
              required
              error={form.formState.errors.address?.city?.message}
              className="sm:col-span-3"
            >
              <Input
                id="addr-city"
                autoComplete="address-level2"
                placeholder="Cidade"
                className="h-10 w-full"
                {...form.register("address.city")}
              />
            </FormField>

            <FormField
              label="UF"
              htmlFor="addr-state"
              required
              error={form.formState.errors.address?.state?.message}
              className="sm:col-span-2"
            >
              <Input
                id="addr-state"
                maxLength={2}
                autoComplete="address-level1"
                placeholder="SC"
                className="h-10 w-full uppercase"
                {...form.register("address.state")}
              />
            </FormField>
            <FormField
              label="CEP"
              htmlFor="addr-zip"
              required
              error={form.formState.errors.address?.zipCode?.message}
              className="sm:col-span-4"
            >
              <Input
                id="addr-zip"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="00000-000"
                className="h-10 w-full font-mono text-sm"
                {...form.register("address.zipCode")}
              />
            </FormField>
          </div>
        </div>

        <div className="flex w-full flex-col-reverse gap-2 border-t border-border/80 pt-6 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-10 sm:min-w-28"
            onClick={() => void router.push("/dashboard/clients")}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="h-10 sm:min-w-36"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "A guardar…" : "Criar cliente"}
          </Button>
        </div>
      </form>
    </div>
  );
}
