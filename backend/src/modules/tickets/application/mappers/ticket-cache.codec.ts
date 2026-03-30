import type { PaginatedResult } from 'src/common/pagination/pagination.types';
import { TicketEntity, TicketStatus } from '../../domain/entities/ticket.entity';
import { Description } from '../../domain/vo/description.vo';

export type CachedTicketRow = {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  userId: string;
};

export type CachedTicketListPage = {
  data: CachedTicketRow[];
  meta: PaginatedResult<TicketEntity>['meta'];
};

export function encodeTicketRow(entity: TicketEntity): CachedTicketRow {
  return {
    id: entity.id,
    title: entity.title,
    description: entity.description.value,
    status: entity.status,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
    userId: entity.userId,
  };
}

export function encodeTicketListPage(
  result: PaginatedResult<TicketEntity>,
): CachedTicketListPage {
  return {
    meta: result.meta,
    data: result.data.map((t) => encodeTicketRow(t)),
  };
}

export function decodeTicketRow(row: CachedTicketRow): TicketEntity {
  return TicketEntity.create({
    id: row.id,
    title: row.title,
    description: Description.create(row.description),
    status: row.status,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    userId: row.userId,
  });
}

export function decodeTicketListPage(
  cached: CachedTicketListPage,
): PaginatedResult<TicketEntity> {
  return {
    meta: cached.meta,
    data: cached.data.map((row) => decodeTicketRow(row)),
  };
}

export function isCachedTicketListPage(v: unknown): v is CachedTicketListPage {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  if (!Array.isArray(o.data) || !o.meta || typeof o.meta !== 'object') return false;
  if (o.data.length === 0) return true;
  const row = o.data[0] as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.title === 'string' &&
    typeof row.description === 'string' &&
    typeof row.status === 'string' &&
    typeof row.createdAt === 'string' &&
    typeof row.updatedAt === 'string' &&
    typeof row.userId === 'string'
  );
}

export function tryDecodeTicketListCache(
  raw: unknown,
): PaginatedResult<TicketEntity> | null {
  if (!isCachedTicketListPage(raw)) return null;
  return decodeTicketListPage(raw);
}
