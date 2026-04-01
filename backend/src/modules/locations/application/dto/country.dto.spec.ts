import { SCreateCountry, SUpdateCountry } from './country.dto';

describe('Country DTOs', () => {
  it('SCreateCountry accepts non-empty name', () => {
    expect(SCreateCountry.safeParse({ name: 'Brasil' }).success).toBe(true);
  });

  it('SCreateCountry rejects empty name', () => {
    expect(SCreateCountry.safeParse({ name: '' }).success).toBe(false);
  });

  it('SUpdateCountry accepts name', () => {
    expect(SUpdateCountry.safeParse({ name: 'X' }).success).toBe(true);
  });
});
