import { randomUUID } from 'node:crypto';
import type { Client } from '@prisma/client';
import { Address } from 'src/common/vo/address.vo';
import { Cpf } from 'src/modules/clients/domain/vo/cpf.vo';
import { ClientEntity } from 'src/modules/clients/domain/entities/client.entity';
import { toDomain, toPrismaCreate } from './client-persistence.mapper';

describe('ClientPersistenceMapper', () => {
  const now = new Date('2025-01-15T10:00:00.000Z');

  it('toDomain maps Prisma row to ClientEntity', () => {
    const row = {
      id: 1,
      uuid: randomUUID(),
      name: 'Maria',
      cpf: '52998224725',
      cnpj: null,
      street: 'Rua A',
      number: '1',
      complement: null,
      neighborhood: 'Centro',
      city: 'Sao Paulo',
      state: 'SP',
      zipCode: '01310100',
      createdAt: now,
      updatedAt: now,
    } satisfies Client;

    const entity = toDomain(row);

    expect(entity.id).toBe(row.uuid);
    expect(entity.name).toBe('Maria');
    expect(entity.cpf?.value).toBe('52998224725');
    expect(entity.address.zipCode).toBe('01310100');
  });

  it('toPrismaCreate mirrors entity fields for insert', () => {
    const entity = ClientEntity.create({
      id: randomUUID(),
      name: 'Joao',
      cpf: Cpf.create('52998224725'),
      address: Address.create({
        street: 'Rua B',
        number: '2',
        neighborhood: 'Bairro',
        city: 'Rio',
        state: 'RJ',
        zipCode: '20000000',
      }),
      createdAt: now,
      updatedAt: now,
    });

    const data = toPrismaCreate(entity);

    expect(data.uuid).toBe(entity.id);
    expect(data.name).toBe('Joao');
    expect(data.cpf).toBe('52998224725');
    expect(data.cnpj).toBeNull();
    expect(data.zipCode).toBe('20000000');
  });
});
