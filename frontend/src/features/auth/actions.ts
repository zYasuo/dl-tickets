"use server";

import type { components } from "@/lib/api/v1";
import { ApiError } from "@/lib/api/api-error";
import {
  ACCESS_TOKEN_COOKIE,
  authUserFromAccessToken,
  backendRequest,
  clearAuthCookies,
  forwardSetCookiesFromBackend,
  setAccessTokenFromJwt,
  tryRefreshSession,
} from "@/lib/api/backend-request";
import type { AuthUser } from "@/features/auth/types";
import { cookies } from "next/headers";

export type RegisterBody = components["schemas"]["CreateUserBodyDto"];
export type UserPublic = components["schemas"]["UserPublicHttpOpenApiDto"];

export async function ALoadSession(): Promise<{ user: AuthUser | null }> {
  const store = await cookies();
  const at = store.get(ACCESS_TOKEN_COOKIE)?.value;
  const user = authUserFromAccessToken(at);
  if (user) {
    return { user };
  }
  const refreshed = await tryRefreshSession();
  if (refreshed) {
    return { user: refreshed };
  }
  await clearAuthCookies();
  return { user: null };
}

export async function ALogin(
  email: string,
  password: string,
): Promise<{ user: AuthUser }> {
  const res = await backendRequest("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw ApiError.fromUnknown(data, res.status);
  }
  await forwardSetCookiesFromBackend(res);
  const envelope = data as {
    success?: boolean;
    data?: { accessToken?: string };
  };
  if (envelope?.success !== true || !envelope.data?.accessToken) {
    throw ApiError.fromUnknown(data, res.status);
  }
  await setAccessTokenFromJwt(envelope.data.accessToken);
  const user = authUserFromAccessToken(envelope.data.accessToken);
  if (!user) {
    throw new Error("Invalid access token");
  }
  return { user };
}

export async function ALogout(): Promise<void> {
  try {
    const res = await backendRequest("/api/v1/auth/logout", {
      method: "POST",
      withBearer: true,
    });
    await forwardSetCookiesFromBackend(res).catch(() => {});
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      throw ApiError.fromUnknown(data, res.status);
    }
  } finally {
    await clearAuthCookies();
  }
}

export async function ARegisterUser(
  body: RegisterBody,
): Promise<UserPublic> {
  const res = await backendRequest("/api/v1/users", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw ApiError.fromUnknown(data, res.status);
  }
  const envelope = data as {
    success?: boolean;
    data?: UserPublic;
  };
  if (envelope?.success !== true || !envelope.data) {
    throw ApiError.fromUnknown(data, res.status);
  }
  return envelope.data;
}

export async function ARequestPasswordReset(
  email: string,
): Promise<string> {
  const res = await backendRequest("/api/v1/auth/password-reset/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw ApiError.fromUnknown(data, res.status);
  }
  const envelope = data as {
    success?: boolean;
    data?: { message?: string };
  };
  if (envelope?.success !== true || !envelope.data?.message) {
    throw ApiError.fromUnknown(data, res.status);
  }
  return envelope.data.message;
}

export async function AConfirmPasswordReset(
  token: string,
  newPassword: string,
): Promise<string> {
  const res = await backendRequest("/api/v1/auth/password-reset/confirm", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw ApiError.fromUnknown(data, res.status);
  }
  const envelope = data as {
    success?: boolean;
    data?: { message?: string };
  };
  if (envelope?.success !== true || !envelope.data?.message) {
    throw ApiError.fromUnknown(data, res.status);
  }
  return envelope.data.message;
}
