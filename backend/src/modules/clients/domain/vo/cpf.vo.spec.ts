import { DomainError } from 'src/common/errors/domain.error';
import { Cpf } from './cpf.vo';

describe('Cpf', () => {
  it('accepts valid CPF without mask', () => {
    const cpf = Cpf.create('52998224725');
    expect(cpf.value).toBe('52998224725');
  });

  it('accepts valid CPF with mask', () => {
    const cpf = Cpf.create('529.982.247-25');
    expect(cpf.value).toBe('52998224725');
  });

  it('rejects wrong length', () => {
    expect(() => Cpf.create('1234567890')).toThrow(DomainError);
  });

  it('rejects all equal digits', () => {
    expect(() => Cpf.create('11111111111')).toThrow(DomainError);
  });

  it('rejects invalid check digits', () => {
    expect(() => Cpf.create('52998224726')).toThrow(DomainError);
  });

  it('equals compares values', () => {
    expect(Cpf.create('52998224725').equals(Cpf.create('529.982.247-25'))).toBe(true);
  });
});
