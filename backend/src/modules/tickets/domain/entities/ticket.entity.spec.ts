import { randomUUID } from 'node:crypto';
import { Description } from '../vo/description.vo';
import { TicketEntity, TicketStatus } from './ticket.entity';

describe('TicketEntity', () => {
  const now = new Date();

  it('create normalizes description via Description VO', () => {
    const entity = TicketEntity.create({
      id: randomUUID(),
      title: 'T',
      description: Description.create('  hello  '),
      status: TicketStatus.OPEN,
      createdAt: now,
      updatedAt: now,
      userId: randomUUID(),
    });

    expect(entity.description.value).toBe('hello');
  });
});
