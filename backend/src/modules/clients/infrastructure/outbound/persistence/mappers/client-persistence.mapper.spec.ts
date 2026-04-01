import { randomUUID } from 'node:crypto';
import { Address } from 'src/common/vo/address.vo';
import { Cpf } from 'src/modules/clients/domain/vo/cpf.vo';
import { ClientEntity } from 'src/modules/clients/domain/entities/client.entity';
import {
  type ClientPersistenceRow,
  toDomain,
  toDomainFromScalar,
  toPrismaCreate,
} from './client-persistence.mapper';

describe('ClientPersistenceMapper', () => {
  const now = new Date('2025-01-15T10:00:00.000Z');
  const stateUuid = randomUUID();
  const cityUuid = randomUUID();

  it('toDomain maps Prisma row with geography to ClientEntity', () => {
    const rowUuid = randomUUID();
    const row = {
      id: 1,
      uuid: rowUuid,
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
      stateId: 10,
      cityId: 20,
      createdAt: now,
      updatedAt: now,
      addressState: {
        id: 10,
        uuid: stateUuid,
        name: 'São Paulo',
        code: 'SP',
        countryId: 1,
        createdAt: now,
        updatedAt: now,
      },
      addressCity: {
        id: 20,
        uuid: cityUuid,
        name: 'Sao Paulo',
        stateId: 10,
        createdAt: now,
        updatedAt: now,
      },
    } satisfies ClientPersistenceRow;

    const entity = toDomain(row);

    expect(entity.id).toBe(rowUuid);
    expect(entity.name).toBe('Maria');
    expect(entity.cpf?.value).toBe('52998224725');
    expect(entity.address.zipCode).toBe('01310100');
    expect(entity.address.stateUuid).toBe(stateUuid);
    expect(entity.address.cityUuid).toBe(cityUuid);
  });

  it('toDomain fills city/state from relations when denormalized columns are null', () => {
    const rowUuid = randomUUID();
    const row = {
      id: 1,
      uuid: rowUuid,
      name: 'Maria',
      cpf: '52998224725',
      cnpj: null,
      street: 'Rua A',
      number: '1',
      complement: null,
      neighborhood: 'Centro',
      city: null,
      state: null,
      zipCode: '01310100',
      stateId: 10,
      cityId: 20,
      createdAt: now,
      updatedAt: now,
      addressState: {
        id: 10,
        uuid: stateUuid,
        name: 'São Paulo',
        code: 'SP',
        countryId: 1,
        createdAt: now,
        updatedAt: now,
      },
      addressCity: {
        id: 20,
        uuid: cityUuid,
        name: 'Campinas',
        stateId: 10,
        createdAt: now,
        updatedAt: now,
      },
    } satisfies ClientPersistenceRow;

    const entity = toDomain(row);

    expect(entity.address.city).toBe('Campinas');
    expect(entity.address.state).toBe('SP');
    expect(entity.address.stateUuid).toBe(stateUuid);
    expect(entity.address.cityUuid).toBe(cityUuid);
  });

  it('toDomain uses placeholders when legacy row has null city and state', () => {
    const rowUuid = randomUUID();
    const row = {
      id: 1,
      uuid: rowUuid,
      name: 'Legacy',
      cpf: '52998224725',
      cnpj: null,
      street: 'Rua A',
      number: '1',
      complement: null,
      neighborhood: 'Centro',
      city: null,
      state: null,
      zipCode: '01310100',
      stateId: null,
      cityId: null,
      createdAt: now,
      updatedAt: now,
      addressState: null,
      addressCity: null,
    } satisfies ClientPersistenceRow;

    const entity = toDomain(row);

    expect(entity.address.city).toBe('(não informado)');
    expect(entity.address.state).toBe('NI');
    expect(entity.address.stateUuid).toBeNull();
    expect(entity.address.cityUuid).toBeNull();
  });

  it('toDomainFromScalar uses placeholders when city and state are null', () => {
    const rowUuid = randomUUID();
    const row = {
      id: 1,
      uuid: rowUuid,
      name: 'X',
      cpf: '52998224725',
      cnpj: null,
      street: 'S',
      number: '1',
      complement: null,
      neighborhood: 'N',
      city: null,
      state: null,
      zipCode: '01310100',
      stateId: null,
      cityId: null,
      createdAt: now,
      updatedAt: now,
    };

    const entity = toDomainFromScalar(row);

    expect(entity.address.city).toBe('(não informado)');
    expect(entity.address.state).toBe('NI');
  });

  it('toPrismaCreate mirrors entity fields for insert', () => {
    const entity = ClientEntity.create({
      id: randomUUID(),
      name: 'Joao',
      cpf: Cpf.create('52998224725'),
      address: Address.createWithGeo(
        {
          street: 'Rua B',
          number: '2',
          neighborhood: 'Bairro',
          zipCode: '20000000',
        },
        {
          stateUuid: randomUUID(),
          cityUuid: randomUUID(),
          cityName: 'Rio',
          stateCode: 'RJ',
        },
      ),
      createdAt: now,
      updatedAt: now,
    });

    const data = toPrismaCreate(entity);

    expect(data.uuid).toBe(entity.id);
    expect(data.name).toBe('Joao');
    expect(data.cpf).toBe('52998224725');
    expect(data.cnpj).toBeNull();
    expect(data.zipCode).toBe('20000000');
    expect(data.addressState).toEqual({ connect: { uuid: entity.address.stateUuid } });
    expect(data.addressCity).toEqual({ connect: { uuid: entity.address.cityUuid } });
  });
});
