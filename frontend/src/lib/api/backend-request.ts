import "server-only";

import { cookies } from "next/headers";
import {
  decodeAccessTokenPayload,
  isAccessTokenExpired,
} from "@/features/auth/lib/jwt-payload";
import type { AuthUser } from "@/features/auth/types";

const backendBase =
  process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export const ACCESS_TOKEN_COOKIE = "accessToken";
export const REFRESH_TOKEN_COOKIE = "refreshToken";

export function authUserFromAccessToken(
  token: string | undefined | null,
): AuthUser | null {
  if (!token) return null;
  const p = decodeAccessTokenPayload(token);
  if (!p?.email || !p.sub || isAccessTokenExpired(p.exp)) return null;
  return { email: p.email, sub: p.sub };
}

export async function buildCookieHeader(): Promise<string> {
  const store = await cookies();
  return store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

export async function forwardSetCookiesFromBackend(res: Response): Promise<void> {
  const raw =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : [];
  if (raw.length === 0) return;

  const store = await cookies();
  for (const line of raw) {
    const segments = line.split(";").map((s) => s.trim());
    const [nameValue, ...attrParts] = segments;
    const eq = nameValue.indexOf("=");
    if (eq === -1) continue;
    const name = nameValue.slice(0, eq).trim();
    const value = decodeURIComponent(nameValue.slice(eq + 1).trim());
    const opts: Parameters<typeof store.set>[2] = {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    };

    for (const a of attrParts) {
      const low = a.toLowerCase();
      if (low === "httponly") opts.httpOnly = true;
      else if (low === "secure") opts.secure = true;
      else if (low.startsWith("path=")) opts.path = a.slice(5).trim() || "/";
      else if (low.startsWith("max-age=")) {
        const sec = Number.parseInt(a.slice(8).trim(), 10);
        if (!Number.isNaN(sec)) opts.maxAge = sec;
      } else if (low.startsWith("samesite=")) {
        const v = a.slice(9).trim().toLowerCase();
        if (v === "strict") opts.sameSite = "strict";
        else if (v === "lax") opts.sameSite = "lax";
        else if (v === "none") opts.sameSite = "none";
      }
    }

    store.set(name, value, opts);
  }
}

export async function setAccessTokenFromJwt(accessToken: string): Promise<void> {
  const store = await cookies();
  const payload = decodeAccessTokenPayload(accessToken);
  const maxAge = payload?.exp
    ? Math.max(60, payload.exp - Math.floor(Date.now() / 1000))
    : 900;

  store.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function clearAuthCookies(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
}

export type BackendRequestInit = RequestInit & {
  withBearer?: boolean;
};

export async function backendRequest(
  path: string,
  init: BackendRequestInit = {},
): Promise<Response> {
  const { withBearer = false, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);

  if (rest.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const cookieHeader = await buildCookieHeader();
  if (cookieHeader) {
    headers.set("Cookie", cookieHeader);
  }

  if (withBearer) {
    const store = await cookies();
    const at = store.get(ACCESS_TOKEN_COOKIE)?.value;
    if (at) {
      headers.set("Authorization", `Bearer ${at}`);
    }
  }

  const url = path.startsWith("http")
    ? path
    : `${backendBase}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    return await fetch(url, {
      ...rest,
      headers,
      cache: "no-store",
    });
  } catch (err) {
    if (isConnectionRefused(err)) {
      throw new Error(
        `Backend unreachable at ${backendBase} (connection refused). Start the API server (e.g. Nest on PORT 3000) and check BACKEND_INTERNAL_URL in frontend/.env.`,
        { cause: err },
      );
    }
    throw err;
  }
}

function isConnectionRefused(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as {
    code?: string;
    cause?: unknown;
    errors?: unknown[];
  };
  if (e.code === "ECONNREFUSED") return true;
  if (e.cause != null) return isConnectionRefused(e.cause);
  if (Array.isArray(e.errors))
    return e.errors.some((t) => isConnectionRefused(t));
  return false;
}

export async function tryRefreshSession(): Promise<AuthUser | null> {
  const res = await backendRequest("/api/v1/auth/refresh", {
    method: "POST",
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    return null;
  }
  await forwardSetCookiesFromBackend(res);
  const envelope = data as {
    success?: boolean;
    data?: { accessToken?: string };
  };
  if (envelope?.success !== true || !envelope.data?.accessToken) {
    return null;
  }
  await setAccessTokenFromJwt(envelope.data.accessToken);
  return authUserFromAccessToken(envelope.data.accessToken);
}
