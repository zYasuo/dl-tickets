import { DomainError } from 'src/common/errors/domain.error';

export type TAddressInput = {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
};

function normalizeZip(raw: string): string {
  return raw.replace(/\D/gu, '');
}

export class Address {
  private constructor(
    readonly street: string,
    readonly number: string,
    readonly complement: string | undefined,
    readonly neighborhood: string,
    readonly city: string,
    readonly state: string,
    readonly zipCode: string,
  ) {}

  static create(input: TAddressInput): Address {
    if (!input || typeof input !== 'object') {
      throw new DomainError('Address is required');
    }

    const street = typeof input.street === 'string' ? input.street.trim() : '';
    const number = typeof input.number === 'string' ? input.number.trim() : '';
    const neighborhood =
      typeof input.neighborhood === 'string' ? input.neighborhood.trim() : '';
    const city = typeof input.city === 'string' ? input.city.trim() : '';
    const stateRaw = typeof input.state === 'string' ? input.state.trim().toUpperCase() : '';
    const zipCode = normalizeZip(
      typeof input.zipCode === 'string' ? input.zipCode : '',
    );
    const complement =
      typeof input.complement === 'string' && input.complement.trim()
        ? input.complement.trim()
        : undefined;

    if (!street) {
      throw new DomainError('Street is required');
    }
    if (!number) {
      throw new DomainError('Address number is required');
    }
    if (!neighborhood) {
      throw new DomainError('Neighborhood is required');
    }
    if (!city) {
      throw new DomainError('City is required');
    }
    if (stateRaw.length !== 2 || !/^[A-Z]{2}$/u.test(stateRaw)) {
      throw new DomainError('State must be a 2-letter UF');
    }
    if (zipCode.length !== 8) {
      throw new DomainError('ZIP code must have 8 digits');
    }

    return new Address(street, number, complement, neighborhood, city, stateRaw, zipCode);
  }
}
