import { SCreateClient } from './create-client.dto';

describe('SCreateClient', () => {
  const address = {
    street: 'Rua A',
    number: '1',
    neighborhood: 'Centro',
    zipCode: '01310100',
    stateUuid: '00000000-0000-4000-8000-000000000010',
    cityUuid: '00000000-0000-4000-8000-000000000020',
  };

  it('rejects when neither CPF nor CNPJ', () => {
    const r = SCreateClient.safeParse({ name: 'X', address });
    expect(r.success).toBe(false);
  });

  it('accepts CPF', () => {
    const r = SCreateClient.safeParse({
      name: 'X',
      cpf: '529.982.247-25',
      address,
    });
    expect(r.success).toBe(true);
  });

  it('rejects CPF when foreign national', () => {
    const r = SCreateClient.safeParse({
      name: 'X',
      cpf: '529.982.247-25',
      cnpj: '11.222.333/0001-81',
      address,
      isForeignNational: true,
    });
    expect(r.success).toBe(false);
  });

  it('accepts CNPJ only when foreign national', () => {
    const r = SCreateClient.safeParse({
      name: 'X',
      cnpj: '11.222.333/0001-81',
      address,
      isForeignNational: true,
    });
    expect(r.success).toBe(true);
  });
});
