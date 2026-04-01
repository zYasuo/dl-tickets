import { SCreateState, SListStatesQuery, SUpdateState } from './state.dto';

describe('State DTOs', () => {
  it('SCreateState requires countryUuid and name', () => {
    const r = SCreateState.safeParse({
      countryUuid: '00000000-0000-4000-8000-000000000001',
      name: 'SP',
    });
    expect(r.success).toBe(true);
  });

  it('SCreateState rejects invalid country uuid', () => {
    expect(SCreateState.safeParse({ countryUuid: 'bad', name: 'SP' }).success).toBe(false);
  });

  it('SListStatesQuery requires uuid', () => {
    expect(
      SListStatesQuery.safeParse({ countryUuid: '00000000-0000-4000-8000-000000000001' }).success,
    ).toBe(true);
  });

  it('SUpdateState accepts nullable code', () => {
    expect(SUpdateState.safeParse({ name: 'X', code: null }).success).toBe(true);
  });
});
