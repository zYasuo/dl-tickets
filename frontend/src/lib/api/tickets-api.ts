import type { components } from "@/lib/api/v1";
import { createBrowserApiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/api-error";

export type TicketPublic = components["schemas"]["TicketPublic"];
export type TicketListInner = components["schemas"]["TicketListInner"];
export type CreateTicketBody = components["schemas"]["CreateTicketBody"];
export type UpdateTicketBody = components["schemas"]["UpdateTicketBody"];

export async function fetchTicketsPage(params: {
  page?: number;
  limit?: number;
  cursor?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: "title" | "status" | "updatedAt" | "createdAt";
  sortOrder?: "asc" | "desc";
  status?: components["schemas"]["TicketStatus"];
}): Promise<TicketListInner> {
  const client = createBrowserApiClient();
  const { data, response } = await client.GET("/tickets", {
    params: { query: params },
  });

  if (response.ok && data?.success === true) {
    return data.data;
  }

  throw ApiError.fromUnknown(data, response.status);
}

export async function createTicket(body: CreateTicketBody): Promise<TicketPublic> {
  const client = createBrowserApiClient();
  const { data, response } = await client.POST("/tickets", { body });

  if ((response.ok || response.status === 201) && data?.success === true) {
    return data.data;
  }

  throw ApiError.fromUnknown(data, response.status);
}

export async function updateTicket(
  id: string,
  body: UpdateTicketBody,
): Promise<TicketPublic> {
  const client = createBrowserApiClient();
  const { data, response } = await client.PATCH("/tickets/{id}", {
    params: { path: { id } },
    body,
  });

  if (response.ok && data?.success === true) {
    return data.data;
  }

  throw ApiError.fromUnknown(data, response.status);
}

export async function findTicketById(
  id: string,
  options?: { maxPages?: number; pageSize?: number },
): Promise<TicketPublic | null> {
  const maxPages = options?.maxPages ?? 40;
  const limit = options?.pageSize ?? 50;
  let page = 1;

  while (page <= maxPages) {
    const { data, meta } = await fetchTicketsPage({ page, limit });
    const found = data.find((t) => t.id === id);
    if (found) return found;
    if (!meta.hasNextPage) break;
    page += 1;
  }

  return null;
}
