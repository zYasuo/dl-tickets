import { DomainError } from 'src/common/errors/domain.error';

export type AddressLegacyInput = {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
};

export type AddressGeoResolved = {
  stateUuid: string;
  cityUuid: string;
  cityName: string;
  stateCode: string;
};

function normalizeZip(raw: string): string {
  return raw.replace(/\D/gu, '');
}

function assertZip(zipCode: string): void {
  if (zipCode.length !== 8) {
    throw new DomainError('ZIP code must have 8 digits');
  }
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
    readonly stateUuid: string | null,
    readonly cityUuid: string | null,
  ) {}

  static createWithGeo(
    input: Omit<AddressLegacyInput, 'city' | 'state'>,
    geo: AddressGeoResolved,
  ): Address {
    if (!input || typeof input !== 'object') {
      throw new DomainError('Address is required');
    }

    const street = typeof input.street === 'string' ? input.street.trim() : '';
    const number = typeof input.number === 'string' ? input.number.trim() : '';
    const neighborhood = typeof input.neighborhood === 'string' ? input.neighborhood.trim() : '';
    const zipCode = normalizeZip(typeof input.zipCode === 'string' ? input.zipCode : '');
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
    assertZip(zipCode);

    const cityName = geo.cityName.trim();
    const stateCode = geo.stateCode.trim().toUpperCase();
    if (!cityName) {
      throw new DomainError('City name is required');
    }
    if (stateCode.length !== 2 || !/^[A-Z]{2}$/u.test(stateCode)) {
      throw new DomainError('State code must be 2 letters');
    }
    if (!geo.stateUuid?.trim() || !geo.cityUuid?.trim()) {
      throw new DomainError('State and city UUIDs are required');
    }

    return new Address(
      street,
      number,
      complement,
      neighborhood,
      cityName,
      stateCode,
      zipCode,
      geo.stateUuid.trim(),
      geo.cityUuid.trim(),
    );
  }

  static createLegacy(input: AddressLegacyInput): Address {
    if (!input || typeof input !== 'object') {
      throw new DomainError('Address is required');
    }

    const street = typeof input.street === 'string' ? input.street.trim() : '';
    const number = typeof input.number === 'string' ? input.number.trim() : '';
    const neighborhood = typeof input.neighborhood === 'string' ? input.neighborhood.trim() : '';
    const city = typeof input.city === 'string' ? input.city.trim() : '';
    const stateRaw = typeof input.state === 'string' ? input.state.trim().toUpperCase() : '';
    const zipCode = normalizeZip(typeof input.zipCode === 'string' ? input.zipCode : '');
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
    assertZip(zipCode);

    return new Address(
      street,
      number,
      complement,
      neighborhood,
      city,
      stateRaw,
      zipCode,
      null,
      null,
    );
  }

  static fromPersistence(input: {
    street: string;
    number: string;
    complement?: string | null;
    neighborhood: string;
    zipCode: string;
    city: string | null;
    state: string | null;
    stateUuid?: string | null;
    cityUuid?: string | null;
  }): Address {
    const street = input.street.trim();
    const number = input.number.trim();
    const neighborhood = input.neighborhood.trim();
    const zipCode = normalizeZip(input.zipCode);
    const complement =
      typeof input.complement === 'string' && input.complement.trim()
        ? input.complement.trim()
        : undefined;

    const su = input.stateUuid?.trim() ?? null;
    const cu = input.cityUuid?.trim() ?? null;
    const city = (input.city ?? '').trim();
    const state = (input.state ?? '').trim().toUpperCase();

    if (su && cu) {
      if (!city || !state) {
        throw new DomainError('Denormalized city and state are required when geography is set');
      }
      assertZip(zipCode);
      return new Address(street, number, complement, neighborhood, city, state, zipCode, su, cu);
    }

    if (!city || !state) {
      throw new DomainError('Incomplete address in persistence');
    }
    return Address.createLegacy({
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
    });
  }
}
