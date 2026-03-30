"use server";

import type { components } from "@/lib/api/v1";
import { ApiError } from "@/lib/api/api-error";
import { backendRequest } from "@/lib/api/backend-request";

export type TicketPublic = components["schemas"]["TicketPublicHttpOpenApiDto"];
export type TicketListInner = components["schemas"]["TicketListInnerOpenApiDto"];
export type CreateTicketBody = components["schemas"]["CreateTicketBodyDto"];
export type UpdateTicketBody = components["schemas"]["UpdateTicketBodyDto"];

function ticketsListQuery(params: {
  page?: number;
  limit?: number;
  cursor?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: "title" | "status" | "updatedAt" | "createdAt";
  sortOrder?: "asc" | "desc";
  status?: TicketPublic["status"];
}): string {
  const search = new URLSearchParams();
  if (params.page != null) search.set("page", String(params.page));
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.cursor != null) search.set("cursor", params.cursor);
  if (params.createdFrom != null) search.set("createdFrom", params.createdFrom);
  if (params.createdTo != null) search.set("createdTo", params.createdTo);
  if (params.sortBy != null) search.set("sortBy", params.sortBy);
  if (params.sortOrder != null) search.set("sortOrder", params.sortOrder);
  if (params.status != null) search.set("status", params.status);
  const q = search.toString();
  return q ? `?${q}` : "";
}

export async function AFetchTicketsPage(params: {
  page?: number;
  limit?: number;
  cursor?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: "title" | "status" | "updatedAt" | "createdAt";
  sortOrder?: "asc" | "desc";
  status?: TicketPublic["status"];
}): Promise<TicketListInner> {
  const res = await backendRequest(`/api/v1/tickets${ticketsListQuery(params)}`, {
    method: "GET",
    withBearer: true,
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw ApiError.fromUnknown(data, res.status);
  }
  const envelope = data as { success?: boolean; data?: TicketListInner };
  if (envelope?.success !== true || !envelope.data) {
    throw ApiError.fromUnknown(data, res.status);
  }
  return envelope.data;
}

export async function ACreateTicket(
  body: CreateTicketBody,
): Promise<TicketPublic> {
  const res = await backendRequest("/api/v1/tickets", {
    method: "POST",
    body: JSON.stringify(body),
    withBearer: true,
  });
  const data: unknown = await res.json().catch(() => null);
  const ok = res.ok || res.status === 201;
  if (!ok) {
    throw ApiError.fromUnknown(data, res.status);
  }
  const envelope = data as { success?: boolean; data?: TicketPublic };
  if (envelope?.success !== true || !envelope.data) {
    throw ApiError.fromUnknown(data, res.status);
  }
  return envelope.data;
}

export async function AUpdateTicket(
  id: string,
  body: UpdateTicketBody,
): Promise<TicketPublic> {
  const res = await backendRequest(`/api/v1/tickets/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    withBearer: true,
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw ApiError.fromUnknown(data, res.status);
  }
  const envelope = data as { success?: boolean; data?: TicketPublic };
  if (envelope?.success !== true || !envelope.data) {
    throw ApiError.fromUnknown(data, res.status);
  }
  return envelope.data;
}

export async function AFindTicketById(id: string): Promise<TicketPublic | null> {
  const res = await backendRequest(`/api/v1/tickets/${encodeURIComponent(id)}`, {
    method: "GET",
    withBearer: true,
  });
  const data: unknown = await res.json().catch(() => null);
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw ApiError.fromUnknown(data, res.status);
  }
  const envelope = data as { success?: boolean; data?: TicketPublic };
  if (envelope?.success !== true || !envelope.data) {
    throw ApiError.fromUnknown(data, res.status);
  }
  return envelope.data;
}
