export type StateEntityProps = {
  id: string;
  name: string;
  code: string | null;
  countryId: string;
  createdAt: Date;
  updatedAt: Date;
};

export class StateEntity {
  constructor(private readonly p: StateEntityProps) {}

  get id(): string {
    return this.p.id;
  }
  get name(): string {
    return this.p.name;
  }
  get code(): string | null {
    return this.p.code;
  }
  get countryId(): string {
    return this.p.countryId;
  }
  get createdAt(): Date {
    return this.p.createdAt;
  }
  get updatedAt(): Date {
    return this.p.updatedAt;
  }

  static create(p: StateEntityProps): StateEntity {
    return new StateEntity(p);
  }
}
