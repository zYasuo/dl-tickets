import { DomainError } from 'src/common/errors/domain.error';
import { Cnpj } from './cnpj.vo';

describe('Cnpj', () => {
  it('accepts valid CNPJ without mask', () => {
    const cnpj = Cnpj.create('11222333000181');
    expect(cnpj.value).toBe('11222333000181');
  });

  it('accepts valid CNPJ with mask', () => {
    const cnpj = Cnpj.create('11.222.333/0001-81');
    expect(cnpj.value).toBe('11222333000181');
  });

  it('rejects wrong length', () => {
    expect(() => Cnpj.create('1122233300018')).toThrow(DomainError);
  });

  it('rejects all equal digits', () => {
    expect(() => Cnpj.create('11111111111111')).toThrow(DomainError);
  });

  it('rejects invalid check digits', () => {
    expect(() => Cnpj.create('11222333000182')).toThrow(DomainError);
  });
});
