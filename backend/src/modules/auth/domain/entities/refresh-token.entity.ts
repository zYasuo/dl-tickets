export type TRefreshTokenEntity = {
  id: number;
  tokenHash: string;
  familyId: string;
  userId: number;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
};

export class RefreshTokenEntity {
  constructor(private readonly params: TRefreshTokenEntity) {}

  get id(): number {
    return this.params.id;
  }

  get tokenHash(): string {
    return this.params.tokenHash;
  }

  get familyId(): string {
    return this.params.familyId;
  }

  get userId(): number {
    return this.params.userId;
  }

  get expiresAt(): Date {
    return this.params.expiresAt;
  }

  get revokedAt(): Date | null {
    return this.params.revokedAt;
  }

  get createdAt(): Date {
    return this.params.createdAt;
  }

  get isExpired(): boolean {
    return this.expiresAt.getTime() < Date.now();
  }

  get isRevoked(): boolean {
    return this.revokedAt !== null;
  }

  static create(input: TRefreshTokenEntity): RefreshTokenEntity {
    return new RefreshTokenEntity(input);
  }
}
