"use client";

import { useFormContext } from "react-hook-form";

import { AddressGeoLookupBlock } from "@/features/clients/components/address-geo-lookup-block";
import { FormFieldRow } from "@/features/clients/components/client-modal/form";
import type { ClientModalFormValues } from "@/features/clients/schemas/client-modal.schema";
import { cn } from "@/lib/utils";
import { Input } from "@/shared/components/ui/input";
import { TabsContent } from "@/shared/components/ui/tabs";

const enderecoInputClass = cn(
  "h-11 min-h-11 w-full px-3.5 py-2 text-base leading-normal md:text-[0.9375rem]",
);

export function ClientTabEnderecoPanel() {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<ClientModalFormValues>();

  return (
    <TabsContent
      value="endereco"
      className="mt-0 max-h-[min(62dvh,640px)] overflow-y-auto pe-1 pt-2 outline-none data-[orientation=horizontal]:mt-0"
    >
      <div className="rounded-xl border border-border/50 bg-muted/5 p-5 shadow-sm ring-1 ring-foreground/5 sm:p-6">
        <header className="mb-5 border-b border-border/40 pb-4">
          <h3 className="text-base font-semibold text-foreground">Morada</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Rua, número, bairro, CEP e localidade (estado e cidade por UUID) são
            obrigatórios. Pode colar o UUID ou a UF do estado; use a lupa para
            pesquisar sem fechar o formulário. Complemento é opcional.
          </p>
        </header>
        <div className="flex flex-col gap-5">
          <FormFieldRow
            label="Rua ou logradouro"
            htmlFor="addr-street"
            required
            error={errors.address?.street?.message}
          >
            <Input
              id="addr-street"
              autoComplete="street-address"
              placeholder="Nome da rua, avenida…"
              className={enderecoInputClass}
              {...register("address.street")}
            />
          </FormFieldRow>
          <FormFieldRow
            label="Número"
            htmlFor="addr-number"
            required
            error={errors.address?.number?.message}
          >
            <Input
              id="addr-number"
              autoComplete="off"
              placeholder="N.º"
              className={enderecoInputClass}
              {...register("address.number")}
            />
          </FormFieldRow>
          <FormFieldRow
            label="Complemento"
            htmlFor="addr-complement"
            error={errors.address?.complement?.message}
          >
            <Input
              id="addr-complement"
              autoComplete="off"
              placeholder="Apartamento, bloco… (opcional)"
              className={enderecoInputClass}
              {...register("address.complement")}
            />
          </FormFieldRow>
          <FormFieldRow
            label="Bairro"
            htmlFor="addr-neighborhood"
            required
            error={errors.address?.neighborhood?.message}
          >
            <Input
              id="addr-neighborhood"
              autoComplete="off"
              placeholder="Bairro"
              className={enderecoInputClass}
              {...register("address.neighborhood")}
            />
          </FormFieldRow>

          <div className="my-1 sm:my-2">
            <AddressGeoLookupBlock<ClientModalFormValues>
              control={control}
              register={register}
              setValue={setValue}
              stateUuidError={errors.address?.stateUuid?.message}
              cityUuidError={errors.address?.cityUuid?.message}
            />
          </div>

          <FormFieldRow
            label="CEP"
            htmlFor="addr-zip"
            required
            error={errors.address?.zipCode?.message}
          >
            <Input
              id="addr-zip"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00000-000"
              className={cn(enderecoInputClass, "font-mono")}
              {...register("address.zipCode")}
            />
          </FormFieldRow>
        </div>
      </div>
    </TabsContent>
  );
}
