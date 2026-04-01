"use server";

import type { components } from "@/lib/api/v1";
import { ApiError } from "@/lib/api/api-error";
import { backendRequest } from "@/lib/api/backend-request";

export type CountryPublic = components["schemas"]["CountryPublicOpenApiDto"];
export type StatePublic = components["schemas"]["StatePublicOpenApiDto"];
export type CityPublic = components["schemas"]["CityPublicOpenApiDto"];

function readEnvelope<T>(data: unknown, status: number): T {
  if (
    typeof data !== "object" ||
    data === null ||
    !("success" in data) ||
    !("data" in data)
  ) {
    throw ApiError.fromUnknown(data, status);
  }
  const envelope = data as { success?: boolean; data?: T };
  if (envelope.success !== true || envelope.data === undefined) {
    throw ApiError.fromUnknown(data, status);
  }
  return envelope.data;
}

export async function AListCountries(): Promise<CountryPublic[]> {
  const res = await backendRequest("/api/v1/countries", {
    method: "GET",
    withBearer: true,
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw ApiError.fromUnknown(data, res.status);
  }
  return readEnvelope<CountryPublic[]>(data, res.status);
}

export async function AFindCountryById(id: string): Promise<CountryPublic> {
  const res = await backendRequest(
    `/api/v1/countries/${encodeURIComponent(id)}`,
    { method: "GET", withBearer: true },
  );
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw ApiError.fromUnknown(data, res.status);
  }
  return readEnvelope<CountryPublic>(data, res.status);
}

export async function AListStates(countryUuid: string): Promise<StatePublic[]> {
  const q = new URLSearchParams({ countryUuid });
  const res = await backendRequest(`/api/v1/states?${q}`, {
    method: "GET",
    withBearer: true,
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw ApiError.fromUnknown(data, res.status);
  }
  return readEnvelope<StatePublic[]>(data, res.status);
}

export async function AFindStateById(id: string): Promise<StatePublic> {
  const res = await backendRequest(`/api/v1/states/${encodeURIComponent(id)}`, {
    method: "GET",
    withBearer: true,
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw ApiError.fromUnknown(data, res.status);
  }
  return readEnvelope<StatePublic>(data, res.status);
}

export async function AListCities(stateUuid: string): Promise<CityPublic[]> {
  const q = new URLSearchParams({ stateUuid });
  const res = await backendRequest(`/api/v1/cities?${q}`, {
    method: "GET",
    withBearer: true,
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw ApiError.fromUnknown(data, res.status);
  }
  return readEnvelope<CityPublic[]>(data, res.status);
}

export async function AFindCityById(id: string): Promise<CityPublic> {
  const res = await backendRequest(`/api/v1/cities/${encodeURIComponent(id)}`, {
    method: "GET",
    withBearer: true,
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw ApiError.fromUnknown(data, res.status);
  }
  return readEnvelope<CityPublic>(data, res.status);
}
