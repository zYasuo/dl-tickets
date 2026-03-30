export type TPasswordResetEntity = {
  id: number;
  tokenHash: string;
  userId: number;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

export class PasswordResetEntity {
  constructor(private readonly params: TPasswordResetEntity) {}

  get id(): number {
    return this.params.id;
  }

  get tokenHash(): string {
    return this.params.tokenHash;
  }

  get userId(): number {
    return this.params.userId;
  }

  get expiresAt(): Date {
    return this.params.expiresAt;
  }

  get usedAt(): Date | null {
    return this.params.usedAt;
  }

  get createdAt(): Date {
    return this.params.createdAt;
  }

  get isExpired(): boolean {
    return this.expiresAt.getTime() < Date.now();
  }

  get isUsed(): boolean {
    return this.usedAt !== null;
  }

  static create(input: TPasswordResetEntity): PasswordResetEntity {
    return new PasswordResetEntity(input);
  }
}
