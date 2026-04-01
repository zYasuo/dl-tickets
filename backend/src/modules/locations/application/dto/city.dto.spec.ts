import { SCreateCity, SListCitiesQuery, SUpdateCity } from './city.dto';

describe('City DTOs', () => {
  it('SCreateCity requires stateUuid and name', () => {
    const r = SCreateCity.safeParse({
      stateUuid: '00000000-0000-4000-8000-000000000010',
      name: 'Campinas',
    });
    expect(r.success).toBe(true);
  });

  it('SListCitiesQuery requires state uuid', () => {
    expect(
      SListCitiesQuery.safeParse({ stateUuid: '00000000-0000-4000-8000-000000000010' }).success,
    ).toBe(true);
  });

  it('SUpdateCity requires name', () => {
    expect(SUpdateCity.safeParse({ name: 'Y' }).success).toBe(true);
    expect(SUpdateCity.safeParse({ name: '' }).success).toBe(false);
  });
});
