import { SCreateClientContract } from './create-client-contract.dto';

describe('SCreateClientContract', () => {
  const address = {
    street: 'Rua A',
    number: '1',
    neighborhood: 'Centro',
    zipCode: '01310100',
    stateUuid: '00000000-0000-4000-8000-000000000010',
    cityUuid: '00000000-0000-4000-8000-000000000020',
  };

  it('requires address when useClientAddress false', () => {
    const r = SCreateClientContract.safeParse({
      contractNumber: 'C1',
      clientId: '123e4567-e89b-12d3-a456-426614174000',
      useClientAddress: false,
      startDate: '2025-01-01',
    });
    expect(r.success).toBe(false);
  });

  it('rejects endDate before startDate', () => {
    const r = SCreateClientContract.safeParse({
      contractNumber: 'C1',
      clientId: '123e4567-e89b-12d3-a456-426614174000',
      useClientAddress: true,
      startDate: '2025-06-01',
      endDate: '2025-01-01',
    });
    expect(r.success).toBe(false);
  });

  it('accepts valid payload with client address', () => {
    const r = SCreateClientContract.safeParse({
      contractNumber: 'C1',
      clientId: '123e4567-e89b-12d3-a456-426614174000',
      useClientAddress: true,
      startDate: '2025-01-01',
    });
    expect(r.success).toBe(true);
  });

  it('accepts own address', () => {
    const r = SCreateClientContract.safeParse({
      contractNumber: 'C1',
      clientId: '123e4567-e89b-12d3-a456-426614174000',
      useClientAddress: false,
      address,
      startDate: '2025-01-01',
    });
    expect(r.success).toBe(true);
  });
});
