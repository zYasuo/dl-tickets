import { SCreateClient } from './create-client.dto';

describe('SCreateClient', () => {
  const address = {
    street: 'Rua A',
    number: '1',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310100',
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
});
