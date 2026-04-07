"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  AFindCityById,
  AFindCountryById,
  AFindStateById,
  AListCities,
  AListCountries,
  AListStates,
} from "@/features/locations/actions";
import { sortCountriesByName } from "@/features/locations/lib/geography-helpers";
import { locationQueryKeys } from "@/features/locations/query-keys";

const STALE_MS = 5 * 60 * 1000;

/** Picks a stable country UUID from GET /countries for list screens (states/cities admin). */
export function useCountrySelectionForLists() {
  const countriesQuery = useCountriesQuery();
  const countries = useMemo(
    () => sortCountriesByName(countriesQuery.data ?? []),
    [countriesQuery.data],
  );
  const [countryUuid, setCountryUuid] = useState("");

  useEffect(() => {
    if (countries.length === 0) return;
    queueMicrotask(() => {
      setCountryUuid((prev) => {
        if (prev && countries.some((c) => c.id === prev)) return prev;
        return countries[0]?.id ?? "";
      });
    });
  }, [countries]);

  return { countriesQuery, countries, countryUuid, setCountryUuid };
}

export function useCountriesQuery() {
  return useQuery({
    queryKey: locationQueryKeys.countries,
    queryFn: () => AListCountries(),
    staleTime: STALE_MS,
  });
}

export function useStatesQuery(countryUuid: string | undefined) {
  const key = countryUuid?.trim() ?? "";
  return useQuery({
    queryKey: locationQueryKeys.states(key),
    queryFn: () => AListStates(key),
    enabled: key.length > 0,
    staleTime: STALE_MS,
  });
}

export function useCitiesQuery(stateUuid: string | undefined) {
  const key = stateUuid?.trim() ?? "";
  return useQuery({
    queryKey: locationQueryKeys.cities(key),
    queryFn: () => AListCities(key),
    enabled: key.length > 0,
    staleTime: STALE_MS,
  });
}

export function useCountryByIdQuery(id: string | undefined, enabled: boolean) {
  const key = id?.trim() ?? "";
  return useQuery({
    queryKey: [...locationQueryKeys.countries, "byId", key],
    queryFn: () => AFindCountryById(key),
    enabled: enabled && key.length > 0,
    staleTime: STALE_MS,
  });
}

export function useStateByIdQuery(id: string | undefined, enabled: boolean) {
  const key = id?.trim() ?? "";
  return useQuery({
    queryKey: [...locationQueryKeys.all, "stateById", key],
    queryFn: () => AFindStateById(key),
    enabled: enabled && key.length > 0,
    staleTime: STALE_MS,
  });
}

export function useCityByIdQuery(id: string | undefined, enabled: boolean) {
  const key = id?.trim() ?? "";
  return useQuery({
    queryKey: [...locationQueryKeys.all, "cityById", key],
    queryFn: () => AFindCityById(key),
    enabled: enabled && key.length > 0,
    staleTime: STALE_MS,
  });
}
