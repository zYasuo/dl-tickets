"use client";

import { useEffect } from "react";
import type {
  Control,
  FieldPath,
  FieldValues,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { useWatch } from "react-hook-form";

import type { AddressBody } from "@/features/clients/schemas/client.schema";
import {
  LocationLookupRow,
  type GeoOption,
} from "@/features/locations/components/location-lookup-row";
import { DEFAULT_COUNTRY_UUID_BR } from "@/features/locations/constants";
import { useCitiesQuery, useStatesQuery } from "@/features/locations/hooks/use-locations";

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
    stateUuidError?: string;
    cityUuidError?: string;
    stackLabel?: boolean;
  };

export function AddressGeoLookupBlock<T extends FieldValues & { address: AddressBody }>({
  control,
  register,
  setValue,
  stateUuidError,
  cityUuidError,
  stackLabel = false,
}: AddressGeoLookupBlockProps<T>) {
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

  const countryUuid: string =
    typeof countryUuidWatch === "string" && countryUuidWatch.trim()
      ? countryUuidWatch.trim()
      : DEFAULT_COUNTRY_UUID_BR;
  const stateUuid: string =
    typeof stateUuidWatch === "string" ? stateUuidWatch : "";
  const cityUuid: string =
    typeof cityUuidWatch === "string" ? cityUuidWatch : "";

  const statesQuery = useStatesQuery(
    countryUuid.trim() ? countryUuid : undefined,
  );
  const citiesQuery = useCitiesQuery(
    stateUuid.trim() ? stateUuid : undefined,
  );

  const stateOptions = toGeoOptions(statesQuery.data ?? []);
  const cityOptions = toGeoOptions(citiesQuery.data ?? []);

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

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <input type="hidden" {...register("address.countryUuid" as FieldPath<T>)} />
      <LocationLookupRow<T>
        control={control}
        setValue={setValue}
        uuidField={"address.stateUuid" as never}
        labelField={"address.stateDisplay" as never}
        mode="state"
        countryUuid={countryUuid.trim() || DEFAULT_COUNTRY_UUID_BR}
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
