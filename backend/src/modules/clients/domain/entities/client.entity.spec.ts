import { randomUUID } from 'node:crypto';
import { Address } from 'src/common/vo/address.vo';
import { DomainError } from 'src/common/errors/domain.error';
import { Cnpj } from '../vo/cnpj.vo';
import { Cpf } from '../vo/cpf.vo';
import { ClientEntity } from './client.entity';

const addr = () =>
  Address.createLegacy({
    street: 'Rua 1',
    number: '10',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310100',
  });

describe('ClientEntity', () => {
  const now = new Date();

  it('create requires at least CPF or CNPJ', () => {
    expect(() =>
      ClientEntity.create({
        id: randomUUID(),
        name: 'ACME',
        address: addr(),
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow(DomainError);
  });

  it('create accepts CPF only', () => {
    const c = ClientEntity.create({
      id: randomUUID(),
      name: 'João',
      cpf: Cpf.create('52998224725'),
      address: addr(),
      createdAt: now,
      updatedAt: now,
    });
    expect(c.cpf?.value).toBe('52998224725');
  });

  it('create accepts CNPJ only', () => {
    const c = ClientEntity.create({
      id: randomUUID(),
      name: 'Empresa',
      cnpj: Cnpj.create('11222333000181'),
      address: addr(),
      createdAt: now,
      updatedAt: now,
    });
    expect(c.cnpj?.value).toBe('11222333000181');
  });

  it('reconstitute allows missing CPF and CNPJ', () => {
    const c = ClientEntity.reconstitute({
      id: randomUUID(),
      name: 'Legado',
      address: addr(),
      createdAt: now,
      updatedAt: now,
    });
    expect(c.cpf).toBeUndefined();
    expect(c.cnpj).toBeUndefined();
  });
});
