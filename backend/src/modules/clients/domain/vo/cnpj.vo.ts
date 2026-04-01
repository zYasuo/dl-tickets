import { DomainError } from 'src/common/errors/domain.error';

function stripNonDigits(raw: string): string {
  return raw.replace(/\D/gu, '');
}

function isValidCnpjDigits(digits: string): boolean {
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/u.test(digits)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]!, 10) * weights1[i]!;
  }
  let d1 = sum % 11;
  d1 = d1 < 2 ? 0 : 11 - d1;
  if (d1 !== parseInt(digits[12]!, 10)) return false;

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i]!, 10) * weights2[i]!;
  }
  let d2 = sum % 11;
  d2 = d2 < 2 ? 0 : 11 - d2;
  return d2 === parseInt(digits[13]!, 10);
}

export class Cnpj {
  static readonly LENGTH = 14;

  private constructor(readonly value: string) {}

  static create(raw: string): Cnpj {
    if (typeof raw !== 'string') {
      throw new DomainError('CNPJ must be a string');
    }

    const digits = stripNonDigits(raw);

    if (digits.length !== Cnpj.LENGTH) {
      throw new DomainError('CNPJ must have exactly 14 digits');
    }

    if (!isValidCnpjDigits(digits)) {
      throw new DomainError('CNPJ is invalid');
    }

    return new Cnpj(digits);
  }

  equals(other: Cnpj): boolean {
    return other instanceof Cnpj && this.value === other.value;
  }
}
