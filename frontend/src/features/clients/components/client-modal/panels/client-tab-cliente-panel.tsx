"use client";

import type { ReactNode } from "react";
import { CreditCard, IdCard } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import { toast } from "sonner";

import {
  DEMO_LOOKUP_CANAL,
  DEMO_LOOKUP_FILIAL,
  DEMO_LOOKUP_TIPO_CLIENTE,
} from "@/features/clients/components/client-modal/client-modal-constants";
import {
  FormDateField,
  FormFieldRow,
  FormLookupField,
  FormRadioGroupField,
  clientFormRowGridClass,
} from "@/features/clients/components/client-modal/form";
import type { ClientModalBody } from "@/features/clients/schemas/client-modal.schema";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { TabsContent } from "@/shared/components/ui/tabs";

type DocKind = "cpf" | "cnpj";

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/50 bg-muted/5 p-4 shadow-sm ring-1 ring-foreground/5 sm:p-5">
      <header className="mb-4 border-b border-border/40 pb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function ClientTabClientePanel() {
  const form = useFormContext<ClientModalBody>();
  const {
    control,
    register,
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = form;

  const documentKind = watch("documentKind");
  const foreignNational = watch("foreignNational");

  const setDocumentKind = (kind: DocKind) => {
    setValue("documentKind", kind);
    if (kind === "cpf") {
      setValue("cnpj", "");
    } else {
      setValue("cpf", "");
    }
    void clearErrors(["cpf", "cnpj"]);
  };

  const documentError =
    errors.cpf?.message ?? errors.cnpj?.message ?? undefined;
  const docInputId =
    documentKind === "cpf" ? "modal-client-cpf" : "modal-client-cnpj";

  return (
    <TabsContent
      value="cliente"
      className="mt-0 max-h-[min(52dvh,520px)] overflow-y-auto pe-1 pt-2 outline-none data-[orientation=horizontal]:mt-0"
    >
      <div className="flex flex-col gap-6 pb-4">
        <FormSection
          title="Dados gerais"
          description="Nome, referências comerciais e filial. Os campos com ícone de informação têm ajuda contextual."
        >
          <FormFieldRow
            label="Nome ou razão social"
            htmlFor="modal-client-name"
            required
            error={errors.name?.message}
          >
            <Input
              id="modal-client-name"
              autoComplete="organization"
              placeholder="Ex.: Maria Silva ou Empresa Lda."
              className="h-10 w-full"
              {...register("name")}
            />
          </FormFieldRow>

          <FormFieldRow
            label="Tipo cliente"
            htmlFor="lookup-tipo"
            infoTooltip="Seleccione o tipo de cliente na base de referência (dados de demonstração)."
          >
            <FormLookupField<ClientModalBody>
              name="tipoClienteLookup"
              control={control}
              options={DEMO_LOOKUP_TIPO_CLIENTE}
              id="lookup-tipo"
            />
          </FormFieldRow>

          <FormFieldRow label="Canal de venda" htmlFor="lookup-canal">
            <FormLookupField<ClientModalBody>
              name="canalVendaLookup"
              control={control}
              options={DEMO_LOOKUP_CANAL}
              id="lookup-canal"
            />
          </FormFieldRow>

          <FormFieldRow label="Filial" htmlFor="lookup-filial">
            <FormLookupField<ClientModalBody>
              name="filialLookup"
              control={control}
              options={DEMO_LOOKUP_FILIAL}
              id="lookup-filial"
            />
          </FormFieldRow>
        </FormSection>

        <FormSection
          title="Classificação e estado"
          description="Tipo de pessoa, tributação, estado do registo e dados pessoais opcionais."
        >
          <FormRadioGroupField<ClientModalBody, "fisica" | "juridica">
            name="personType"
            control={control}
            legend="Tipo pessoa"
            options={[
              { value: "fisica", label: "Física" },
              { value: "juridica", label: "Jurídica" },
            ]}
          />

          <FormRadioGroupField<
            ClientModalBody,
            "contribuinte" | "nao_contribuinte" | "isento"
          >
            name="icmsContributor"
            control={control}
            legend="Contribuinte ICMS"
            options={[
              { value: "contribuinte", label: "Contribuinte" },
              { value: "nao_contribuinte", label: "Não contribuinte" },
              { value: "isento", label: "Isento" },
            ]}
          />

          <Controller
            name="active"
            control={control}
            render={({ field }) => {
              const activeLegendId = "cliente-ativo-legend";
              return (
                <div className={clientFormRowGridClass} role="group">
                  <div
                    id={activeLegendId}
                    className="pt-0.5 text-sm font-medium leading-snug text-muted-foreground sm:pt-2"
                  >
                    Ativo
                  </div>
                  <div
                    role="radiogroup"
                    aria-labelledby={activeLegendId}
                    className="flex min-w-0 flex-wrap gap-1 rounded-lg border border-border/60 bg-muted/30 p-1"
                  >
                    {(
                      [
                        { v: true, label: "Sim" },
                        { v: false, label: "Não" },
                      ] as const
                    ).map(({ v, label }) => {
                      const selected = field.value === v;
                      return (
                        <label
                          key={String(v)}
                          className={cn(
                            "cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            selected
                              ? "bg-background text-foreground shadow-sm ring-1 ring-border/80"
                              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                          )}
                        >
                          <input
                            type="radio"
                            className="sr-only"
                            checked={selected}
                            onChange={() => field.onChange(v)}
                            onBlur={field.onBlur}
                          />
                          {label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            }}
          />

          <FormRadioGroupField<
            ClientModalBody,
            "masculino" | "feminino" | "nao_informar"
          >
            name="sex"
            control={control}
            legend="Sexo"
            options={[
              { value: "masculino", label: "Masculino" },
              { value: "feminino", label: "Feminino" },
              { value: "nao_informar", label: "Não informar" },
            ]}
          />

          <FormFieldRow
            label="Data de nascimento"
            htmlFor="birth-date"
            infoTooltip="Opcional — útil para pessoa física."
          >
            <FormDateField<ClientModalBody>
              name="birthDate"
              control={control}
              id="birth-date"
            />
          </FormFieldRow>
        </FormSection>

        <FormSection
          title="Regime e documento"
          description="Indique se o cliente é estrangeiro e preencha o documento fiscal."
        >
          <Controller
            name="foreignNational"
            control={control}
            render={({ field }) => (
              <FormFieldRow
                label="Cliente estrangeiro"
                htmlFor="foreign-national-check"
                hint="Sem CPF brasileiro — indica apenas CNPJ."
              >
                <label
                  htmlFor="foreign-national-check"
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/50 bg-background/50 px-3 py-2.5 transition-colors hover:bg-muted/20"
                >
                  <input
                    id="foreign-national-check"
                    type="checkbox"
                    ref={field.ref}
                    name={field.name}
                    onBlur={field.onBlur}
                    className="mt-0.5 size-4 shrink-0 rounded border-border accent-primary"
                    checked={field.value ?? false}
                    onChange={(e) => {
                      const next = e.target.checked;
                      field.onChange(next);
                      if (next) {
                        setValue("documentKind", "cnpj");
                        setValue("cpf", "");
                        void clearErrors(["cpf", "cnpj"]);
                      }
                    }}
                  />
                  <span className="text-sm leading-snug text-foreground">
                    Marque se não houver CPF brasileiro válido.
                  </span>
                </label>
              </FormFieldRow>
            )}
          />

          {!foreignNational ? (
            <FormFieldRow
              label="Documento"
              htmlFor={docInputId}
              required
              error={documentError}
            >
              <div className="flex w-full flex-col gap-3">
                <div
                  className="inline-flex w-full max-w-full rounded-lg border border-border/60 bg-muted/30 p-1 sm:w-fit"
                  role="group"
                  aria-label="Tipo de documento"
                >
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
                        "min-h-9 flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors sm:flex-none",
                        documentKind === kind
                          ? "bg-background text-foreground shadow-sm ring-1 ring-border/80"
                          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {documentKind === "cpf" ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                    <Input
                      id="modal-client-cpf"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="000.000.000-00"
                      aria-invalid={!!errors.cpf}
                      className="h-10 min-h-10 w-full min-w-0 flex-1 font-mono text-sm"
                      {...register("cpf")}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      className="h-10 shrink-0 gap-1.5 sm:w-auto"
                      title="Leitura de cartão CPF (integração futura)"
                      onClick={() =>
                        toast.message("Cartão CPF — integração em breve.")
                      }
                    >
                      <CreditCard className="size-4" aria-hidden />
                      Cartão CPF
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                    <Input
                      id="modal-client-cnpj"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="00.000.000/0000-00"
                      aria-invalid={!!errors.cnpj}
                      className="h-10 min-h-10 w-full min-w-0 flex-1 font-mono text-sm"
                      {...register("cnpj")}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      className="h-10 shrink-0 gap-1.5 sm:w-auto"
                      title="Consulta cadastro (integração futura)"
                      onClick={() =>
                        toast.message("Consulta CNPJ — integração em breve.")
                      }
                    >
                      <IdCard className="size-4" aria-hidden />
                      Consulta CNPJ
                    </Button>
                  </div>
                )}
              </div>
            </FormFieldRow>
          ) : (
            <FormFieldRow
              label="CNPJ"
              htmlFor="modal-client-cnpj-foreign"
              required
              error={errors.cnpj?.message}
            >
              <Input
                id="modal-client-cnpj-foreign"
                inputMode="numeric"
                autoComplete="off"
                placeholder="00.000.000/0000-00"
                className="h-10 w-full font-mono text-sm"
                {...register("cnpj")}
              />
            </FormFieldRow>
          )}
        </FormSection>
      </div>
    </TabsContent>
  );
}
