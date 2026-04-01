import { randomUUID } from 'node:crypto';
import { Address } from 'src/common/vo/address.vo';
import { DomainError } from 'src/common/errors/domain.error';
import { ClientContractEntity, ClientContractStatus } from './client-contract.entity';

const base = () => ({
  id: randomUUID(),
  contractNumber: 'CTR-1',
  clientId: randomUUID(),
  useClientAddress: true,
  startDate: new Date('2025-01-01T00:00:00.000Z'),
  status: ClientContractStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('ClientContractEntity', () => {
  it('create rejects endDate before startDate', () => {
    expect(() =>
      ClientContractEntity.create({
        ...base(),
        endDate: new Date('2024-12-01T00:00:00.000Z'),
      }),
    ).toThrow(DomainError);
  });

  it('create requires address when useClientAddress is false', () => {
    expect(() =>
      ClientContractEntity.create({
        ...base(),
        useClientAddress: false,
      }),
    ).toThrow(DomainError);
  });

  it('create accepts own address', () => {
    const e = ClientContractEntity.create({
      ...base(),
      useClientAddress: false,
      address: Address.createLegacy({
        street: 'B',
        number: '2',
        neighborhood: 'N',
        city: 'C',
        state: 'RJ',
        zipCode: '20000000',
      }),
    });
    expect(e.useClientAddress).toBe(false);
    expect(e.address).toBeDefined();
  });
});
