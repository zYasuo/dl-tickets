"use server";

import { ApiError } from "@/lib/api/api-error";
import { CLIENT_UI_ERROR_CODES } from "@/lib/api/api-error-codes";
import {
  ACCESS_TOKEN_COOKIE,
  authUserFromAccessToken,
  backendRequest,
  clearAuthCookies,
  forwardSetCookiesFromBackend,
  setAccessTokenFromJwt,
  tryRefreshSession,
} from "@/lib/api/backend-request";
import type {
  AuthUser,
  AuthActionFailure,
  AuthMessageActionResult,
  LoginActionResult,
  LogoutActionResult,
  RegisterActionResult,
} from "@/features/auth/types";
import type { components } from "@/lib/api/v1";
import { cookies } from "next/headers";

function authFailureFromResponse(
  data: unknown,
  statusCode: number,
): AuthActionFailure {
  if (ApiError.isStandardError(data)) {
    const m = data.message;
    return {
      ok: false,
      statusCode: data.statusCode,
      code: data.code,
      message: typeof m === "string" ? m : m.join("\n"),
    };
  }
  return {
    ok: false,
    statusCode,
    code: CLIENT_UI_ERROR_CODES.REQUEST_FAILED,
    message: "Invalid request or server unavailable.",
  };
}

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
): Promise<LoginActionResult> {
  const res = await backendRequest("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    return authFailureFromResponse(data, res.status);
  }
  await forwardSetCookiesFromBackend(res);
  const envelope = data as {
    success?: boolean;
    data?: { accessToken?: string };
  };
  if (envelope?.success !== true || !envelope.data?.accessToken) {
    return authFailureFromResponse(data, res.status);
  }
  await setAccessTokenFromJwt(envelope.data.accessToken);
  const user = authUserFromAccessToken(envelope.data.accessToken);
  if (!user) {
    return {
      ok: false,
      statusCode: 500,
      code: CLIENT_UI_ERROR_CODES.INVALID_ACCESS_TOKEN,
      message: "Invalid access token",
    };
  }
  return { ok: true, user };
}

export async function ALogout(): Promise<LogoutActionResult> {
  let failure: AuthActionFailure | null = null;
  try {
    const res = await backendRequest("/api/v1/auth/logout", {
      method: "POST",
      withBearer: true,
    });
    await forwardSetCookiesFromBackend(res).catch(() => {});
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      failure = authFailureFromResponse(data, res.status);
    }
  } finally {
    await clearAuthCookies();
  }
  if (failure) return failure;
  return { ok: true };
}

export async function ARegisterUser(
  body: components["schemas"]["CreateUserBodyDto"],
): Promise<RegisterActionResult> {
  const res = await backendRequest("/api/v1/users", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    return authFailureFromResponse(data, res.status);
  }
  const envelope = data as {
    success?: boolean;
    data?: components["schemas"]["UserPublicHttpOpenApiDto"];
  };
  if (envelope?.success !== true || !envelope.data) {
    return authFailureFromResponse(data, res.status);
  }
  return { ok: true, user: envelope.data };
}

export async function ARequestPasswordReset(
  email: string,
): Promise<AuthMessageActionResult> {
  const res = await backendRequest("/api/v1/auth/password-reset/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    return authFailureFromResponse(data, res.status);
  }
  const envelope = data as {
    success?: boolean;
    data?: { message?: string };
  };
  if (envelope?.success !== true || !envelope.data?.message) {
    return authFailureFromResponse(data, res.status);
  }
  return { ok: true, message: envelope.data.message };
}

export async function AConfirmPasswordReset(
  token: string,
  newPassword: string,
): Promise<AuthMessageActionResult> {
  const res = await backendRequest("/api/v1/auth/password-reset/confirm", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    return authFailureFromResponse(data, res.status);
  }
  const envelope = data as {
    success?: boolean;
    data?: { message?: string };
  };
  if (envelope?.success !== true || !envelope.data?.message) {
    return authFailureFromResponse(data, res.status);
  }
  return { ok: true, message: envelope.data.message };
}

export async function AVerifyEmail(
  email: string,
  code: string,
): Promise<AuthMessageActionResult> {
  const res = await backendRequest("/api/v1/auth/email/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    return authFailureFromResponse(data, res.status);
  }
  const envelope = data as {
    success?: boolean;
    data?: { message?: string };
  };
  if (envelope?.success !== true || !envelope.data?.message) {
    return authFailureFromResponse(data, res.status);
  }
  return { ok: true, message: envelope.data.message };
}

export async function AResendEmailVerification(
  email: string,
): Promise<AuthMessageActionResult> {
  const res = await backendRequest("/api/v1/auth/email/resend", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    return authFailureFromResponse(data, res.status);
  }
  const envelope = data as {
    success?: boolean;
    data?: { message?: string };
  };
  if (envelope?.success !== true || !envelope.data?.message) {
    return authFailureFromResponse(data, res.status);
  }
  return { ok: true, message: envelope.data.message };
}
