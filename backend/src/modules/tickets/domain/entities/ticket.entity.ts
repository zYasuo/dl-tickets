import { Description } from '../vo/description.vo';

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export type TTicketEntity = {
  id: string;
  title: string;
  description: Description;
  status: TicketStatus;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
};

export class TicketEntity {
  constructor(private readonly params: TTicketEntity) {}

  get id(): string {
    return this.params.id;
  }

  get title(): string {
    return this.params.title;
  }

  get description(): Description {
    return this.params.description;
  }

  get status(): TicketStatus {
    return this.params.status;
  }

  get createdAt(): Date {
    return this.params.createdAt;
  }

  get updatedAt(): Date {
    return this.params.updatedAt;
  }

  get userId(): string {
    return this.params.userId;
  }

  static create(input: TTicketEntity): TicketEntity {
    const description = Description.create(input.description.value);
    return new TicketEntity({
      ...input,
      description,
    });
  }
}
