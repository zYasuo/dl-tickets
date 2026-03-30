import createClient from "openapi-fetch";
import type { paths } from "@/lib/api/v1";

export function createBrowserApiClient() {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_PATH?.replace(/\/$/, "") ?? "/api/v1";
  return createClient<paths>({ baseUrl: base });
}
