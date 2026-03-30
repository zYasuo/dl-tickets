export type TAccessTokenPayload = {
  sub: string;
  email: string;
};

export abstract class TokenProviderPort {
  abstract signAccessToken(payload: TAccessTokenPayload): Promise<string>;
  abstract verifyAccessToken(token: string): Promise<TAccessTokenPayload>;
  abstract generateRefreshToken(): string;
  abstract hashToken(token: string): string;
}
