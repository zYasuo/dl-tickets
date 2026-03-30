export type AccessTokenPayload = {
  sub: string;
  email: string;
  exp?: number;
};

export function decodeAccessTokenPayload(
  token: string,
): AccessTokenPayload | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json) as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function isAccessTokenExpired(exp: number | undefined): boolean {
  if (exp == null) return true;
  return Date.now() >= exp * 1000 - 5000;
}
