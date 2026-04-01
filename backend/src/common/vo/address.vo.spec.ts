import { DomainError } from 'src/common/errors/domain.error';
import { Address } from './address.vo';

describe('Address', () => {
  const validLegacy = {
    street: 'Rua A',
    number: '100',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'sp',
    zipCode: '01310-100',
  };

  it('createLegacy normalizes state and zip', () => {
    const a = Address.createLegacy(validLegacy);
    expect(a.state).toBe('SP');
    expect(a.zipCode).toBe('01310100');
    expect(a.complement).toBeUndefined();
    expect(a.stateUuid).toBeNull();
    expect(a.cityUuid).toBeNull();
  });

  it('createLegacy accepts optional complement', () => {
    const a = Address.createLegacy({ ...validLegacy, complement: '  apt 2  ' });
    expect(a.complement).toBe('apt 2');
  });

  it('createLegacy rejects invalid UF', () => {
    expect(() => Address.createLegacy({ ...validLegacy, state: 'SPP' })).toThrow(DomainError);
  });

  it('createLegacy rejects short zip', () => {
    expect(() => Address.createLegacy({ ...validLegacy, zipCode: '123' })).toThrow(DomainError);
  });

  it('createWithGeo sets UUIDs', () => {
    const a = Address.createWithGeo(
      {
        street: 'Rua A',
        number: '1',
        neighborhood: 'Centro',
        zipCode: '01310100',
      },
      {
        stateUuid: '00000000-0000-4000-8000-000000000010',
        cityUuid: '00000000-0000-4000-8000-000000000020',
        cityName: 'São Paulo',
        stateCode: 'SP',
      },
    );
    expect(a.stateUuid).toBe('00000000-0000-4000-8000-000000000010');
    expect(a.cityUuid).toBe('00000000-0000-4000-8000-000000000020');
    expect(a.city).toBe('São Paulo');
    expect(a.state).toBe('SP');
  });
});
