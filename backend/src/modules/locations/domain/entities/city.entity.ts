export type CityEntityProps = {
  id: string;
  name: string;
  stateId: string;
  createdAt: Date;
  updatedAt: Date;
};

export class CityEntity {
  constructor(private readonly p: CityEntityProps) {}

  get id(): string {
    return this.p.id;
  }
  get name(): string {
    return this.p.name;
  }
  get stateId(): string {
    return this.p.stateId;
  }
  get createdAt(): Date {
    return this.p.createdAt;
  }
  get updatedAt(): Date {
    return this.p.updatedAt;
  }

  static create(p: CityEntityProps): CityEntity {
    return new CityEntity(p);
  }
}
