import { DomainError } from 'src/common/errors/domain.error';
import { Address } from './address.vo';

describe('Address', () => {
  const valid = {
    street: 'Rua A',
    number: '100',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'sp',
    zipCode: '01310-100',
  };

  it('creates with normalized state and zip', () => {
    const a = Address.create(valid);
    expect(a.state).toBe('SP');
    expect(a.zipCode).toBe('01310100');
    expect(a.complement).toBeUndefined();
  });

  it('accepts optional complement', () => {
    const a = Address.create({ ...valid, complement: '  apt 2  ' });
    expect(a.complement).toBe('apt 2');
  });

  it('rejects invalid UF', () => {
    expect(() => Address.create({ ...valid, state: 'SPP' })).toThrow(DomainError);
  });

  it('rejects short zip', () => {
    expect(() => Address.create({ ...valid, zipCode: '123' })).toThrow(DomainError);
  });
});
