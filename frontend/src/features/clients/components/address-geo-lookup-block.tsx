"use client";

import { useEffect, useMemo } from "react";
import type {
  Control,
  FieldPath,
  FieldValues,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";

import type { AddressBody } from "@/features/clients/schemas/client.schema";
import {
  LocationLookupRow,
  type GeoOption,
} from "@/features/locations/components/location-lookup-row";
import {
  useCitiesQuery,
  useCountriesQuery,
  useStateByIdQuery,
  useStatesQuery,
} from "@/features/locations/hooks/use-locations";
import { clientFormRowGridClass } from "@/features/clients/components/client-modal/form/form-field-row";
import { isUuidString, sortCountriesByName } from "@/features/locations/lib/geography-helpers";
import { cn } from "@/lib/utils";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";

function toGeoOptions(
  rows: { id: string; name: string; code?: unknown }[],
): GeoOption[] {
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    code:
      r.code == null || typeof r.code === "object"
        ? null
        : String(r.code),
  }));
}

type AddressGeoLookupBlockProps<T extends FieldValues & { address: AddressBody }> =
  {
    control: Control<T>;
    register: UseFormRegister<T>;
    setValue: UseFormSetValue<T>;
    countryUuidError?: string;
    stateUuidError?: string;
    cityUuidError?: string;
    stackLabel?: boolean;
  };

export function AddressGeoLookupBlock<T extends FieldValues & { address: AddressBody }>({
  control,
  setValue,
  countryUuidError,
  stateUuidError,
  cityUuidError,
  stackLabel = false,
  ..._unused
}: AddressGeoLookupBlockProps<T>) {
  void _unused;

  const countryUuidWatch = useWatch({
    control,
    name: "address.countryUuid" as FieldPath<T>,
  });
  const stateUuidWatch = useWatch({
    control,
    name: "address.stateUuid" as FieldPath<T>,
  });
  const cityUuidWatch = useWatch({
    control,
    name: "address.cityUuid" as FieldPath<T>,
  });

  const countriesQuery = useCountriesQuery();
  const countriesSorted = useMemo(
    () => sortCountriesByName(countriesQuery.data ?? []),
    [countriesQuery.data],
  );

  const stateUuid: string =
    typeof stateUuidWatch === "string" ? stateUuidWatch : "";
  const cityUuid: string =
    typeof cityUuidWatch === "string" ? cityUuidWatch : "";
  const countryUuidStr: string =
    typeof countryUuidWatch === "string" ? countryUuidWatch : "";

  const stateMetaQuery = useStateByIdQuery(
    stateUuid.trim() || undefined,
    !!stateUuid.trim(),
  );

  useEffect(() => {
    if (!stateUuid.trim() || !stateMetaQuery.isSuccess || !stateMetaQuery.data) {
      return;
    }
    const cid = stateMetaQuery.data.countryId?.trim() ?? "";
    if (!cid) return;
    const current = countryUuidStr.trim();
    if (current === cid) return;
    setValue("address.countryUuid" as FieldPath<T>, cid as never, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [
    stateUuid,
    stateMetaQuery.isSuccess,
    stateMetaQuery.data,
    countryUuidStr,
    setValue,
  ]);

  useEffect(() => {
    if (!countriesQuery.isSuccess || countriesSorted.length === 0) return;
    const current = countryUuidStr.trim();
    const ok =
      current.length > 0 &&
      isUuidString(current) &&
      countriesSorted.some((c) => c.id === current);
    if (ok) return;
    if (stateUuid.trim()) return;
    setValue(
      "address.countryUuid" as FieldPath<T>,
      countriesSorted[0]!.id as never,
      {
        shouldValidate: true,
        shouldDirty: true,
      },
    );
  }, [
    countriesQuery.isSuccess,
    countriesSorted,
    countryUuidStr,
    stateUuid,
    setValue,
  ]);

  const countryUuidForStates =
    countryUuidStr.trim() && isUuidString(countryUuidStr)
      ? countryUuidStr.trim()
      : undefined;

  const statesQuery = useStatesQuery(countryUuidForStates);
  const citiesQuery = useCitiesQuery(
    stateUuid.trim() ? stateUuid : undefined,
  );

  const stateOptions = toGeoOptions(statesQuery.data ?? []);
  const cityOptions = toGeoOptions(citiesQuery.data ?? []);

  const countrySelectItems = useMemo(
    () =>
      Object.fromEntries(
        countriesSorted.map((c) => [c.id, c.name] as const),
      ),
    [countriesSorted],
  );

  function clearStateAndCity() {
    setValue("address.stateUuid" as FieldPath<T>, "" as never, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("address.cityUuid" as FieldPath<T>, "" as never, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("address.stateDisplay" as FieldPath<T>, "" as never, {
      shouldValidate: false,
      shouldDirty: true,
    });
    setValue("address.cityDisplay" as FieldPath<T>, "" as never, {
      shouldValidate: false,
      shouldDirty: true,
    });
  }

  useEffect(() => {
    if (!stateUuid.trim()) {
      setValue("address.cityUuid" as FieldPath<T>, "" as never, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("address.cityDisplay" as FieldPath<T>, "" as never, {
        shouldValidate: false,
        shouldDirty: true,
      });
    }
  }, [stateUuid, setValue]);

  useEffect(() => {
    if (!stateUuid.trim() || !citiesQuery.isSuccess) return;
    const cid = cityUuid.trim();
    if (!cid) return;
    const list = citiesQuery.data ?? [];
    const ok = list.some((c) => c.id === cid);
    if (!ok) {
      setValue("address.cityUuid" as FieldPath<T>, "" as never, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("address.cityDisplay" as FieldPath<T>, "" as never, {
        shouldValidate: false,
        shouldDirty: true,
      });
    }
  }, [
    stateUuid,
    cityUuid,
    citiesQuery.isSuccess,
    citiesQuery.data,
    setValue,
  ]);

  const countryLabel = (
    <>
      País
      <span className="text-destructive" aria-hidden>
        {" "}
        *
      </span>
    </>
  );

  const countryControl = (
    <Controller
      control={control}
      name={"address.countryUuid" as FieldPath<T>}
      render={({ field }) => (
        <>
          {countriesQuery.isPending ? (
            <Skeleton className="h-10 w-full" />
          ) : countriesQuery.isError ? (
            <p className="text-sm text-destructive">
              Não foi possível carregar os países.
            </p>
          ) : countriesSorted.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum país cadastrado.
            </p>
          ) : (
            <Select
              items={countrySelectItems}
              value={typeof field.value === "string" ? field.value : ""}
              onValueChange={(v) => {
                field.onChange(v ?? "");
                clearStateAndCity();
              }}
              modal={false}
            >
              <SelectTrigger
                id="addr-country-uuid"
                className="h-10 w-full"
                size="default"
              >
                <SelectValue placeholder="País" />
              </SelectTrigger>
              <SelectContent side="bottom" align="start">
                <SelectGroup>
                  {countriesSorted.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </>
      )}
    />
  );

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      {stackLabel ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="addr-country-uuid" className="text-sm font-medium">
            {countryLabel}
          </Label>
          {countryControl}
          {countryUuidError ? (
            <p className="text-sm text-destructive">{countryUuidError}</p>
          ) : null}
        </div>
      ) : (
        <div className={cn("w-full", clientFormRowGridClass)}>
          <div className="flex items-start gap-1.5 pt-0.5 sm:pt-2.5">
            <label
              htmlFor="addr-country-uuid"
              className="text-sm font-medium leading-snug text-muted-foreground"
            >
              {countryLabel}
            </label>
          </div>
          <div className="min-w-0 max-w-full space-y-1.5">
            {countryControl}
            {countryUuidError ? (
              <p className="text-sm text-destructive" role="alert">
                {countryUuidError}
              </p>
            ) : null}
          </div>
        </div>
      )}

      <LocationLookupRow<T>
        control={control}
        setValue={setValue}
        uuidField={"address.stateUuid" as never}
        labelField={"address.stateDisplay" as never}
        mode="state"
        countryUuid={countryUuidForStates}
        options={stateOptions}
        optionsLoading={statesQuery.isPending}
        optionsError={statesQuery.isError}
        formLabel="Estado"
        htmlForCode="addr-state-uuid"
        htmlForLabel="addr-state-label"
        required
        error={stateUuidError}
        searchDialogTitle="Pesquisar estado"
        stackLabel={stackLabel}
      />
      <LocationLookupRow<T>
        control={control}
        setValue={setValue}
        uuidField={"address.cityUuid" as never}
        labelField={"address.cityDisplay" as never}
        mode="city"
        parentStateUuid={stateUuid.trim() || undefined}
        options={cityOptions}
        optionsLoading={citiesQuery.isPending}
        optionsError={citiesQuery.isError}
        disabled={!stateUuid.trim()}
        formLabel="Cidade"
        htmlForCode="addr-city-uuid"
        htmlForLabel="addr-city-label"
        required
        error={cityUuidError}
        searchDialogTitle="Pesquisar cidade"
        stackLabel={stackLabel}
      />
    </div>
  );
}
