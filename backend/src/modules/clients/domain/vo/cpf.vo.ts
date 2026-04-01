import { DomainError } from 'src/common/errors/domain.error';

function stripNonDigits(raw: string): string {
  return raw.replace(/\D/gu, '');
}

function isValidCpfDigits(digits: string): boolean {
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/u.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i], 10) * (10 - i);
  }
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(digits[9], 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i], 10) * (11 - i);
  }
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(digits[10], 10);
}

export class Cpf {
  static readonly LENGTH = 11;

  private constructor(readonly value: string) {}

  static isValidDigitChecksum(digits: string): boolean {
    return digits.length === Cpf.LENGTH && isValidCpfDigits(digits);
  }

  static create(raw: string): Cpf {
    if (typeof raw !== 'string') {
      throw new DomainError('CPF must be a string');
    }

    const digits = stripNonDigits(raw);

    if (digits.length !== Cpf.LENGTH) {
      throw new DomainError('CPF must have exactly 11 digits');
    }

    if (!isValidCpfDigits(digits)) {
      throw new DomainError('CPF is invalid');
    }

    return new Cpf(digits);
  }

  equals(other: Cpf): boolean {
    return other instanceof Cpf && this.value === other.value;
  }
}
