export type CountryEntityProps = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export class CountryEntity {
  constructor(private readonly p: CountryEntityProps) {}

  get id(): string {
    return this.p.id;
  }
  get name(): string {
    return this.p.name;
  }
  get createdAt(): Date {
    return this.p.createdAt;
  }
  get updatedAt(): Date {
    return this.p.updatedAt;
  }

  static create(p: CountryEntityProps): CountryEntity {
    return new CountryEntity(p);
  }
}
