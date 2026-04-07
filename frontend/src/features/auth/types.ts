import type { components } from "@/lib/api/v1";

export type AuthUser = {
  sub: string;
  email: string;
};

export type RegisterBody = components["schemas"]["CreateUserBodyDto"];
export type UserPublic = components["schemas"]["UserPublicHttpOpenApiDto"];

export type AuthActionFailure = {
  ok: false;
  statusCode: number;
  message: string;
  code?: string;
};

export type LoginActionResult =
  | { ok: true; user: AuthUser }
  | AuthActionFailure;

export type RegisterActionResult =
  | { ok: true; user: UserPublic }
  | AuthActionFailure;

export type AuthMessageActionResult =
  | { ok: true; message: string }
  | AuthActionFailure;

export type LogoutActionResult = { ok: true } | AuthActionFailure;
