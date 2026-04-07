import { CLIENT_API_ERROR_CODES } from 'src/modules/clients/application/errors';
import { CONTRACT_API_ERROR_CODES } from 'src/modules/client-contracts/application/errors';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { PrismaService } from 'nestjs-prisma';
import { CreateClientUseCase } from 'src/modules/clients/application/use-cases/create-client.use-case';
import { ClientsModule } from 'src/modules/clients/clients.module';
import type { CreateClientContractBody } from 'src/modules/client-contracts/application/dto/create-client-contract.dto';
import { CreateClientContractUseCase } from 'src/modules/client-contracts/application/use-cases/create-client-contract.use-case';
import { ClientContractsModule } from 'src/modules/client-contracts/client-contracts.module';
import type { CreateClientBody } from 'src/modules/clients/application/dto/create-client.dto';
import { UsersModule } from 'src/modules/users/users.module';
import { QueueModule } from 'src/modules/queue/queue';

const integrationAddress: CreateClientBody['address'] = {
  street: 'Rua X',
  number: '1',
  neighborhood: 'N',
  zipCode: '01310100',
  stateUuid: '00000000-0000-4000-8000-000000000010',
  cityUuid: '00000000-0000-4000-8000-000000000020',
};

const runIntegration = process.env.RUN_INTEGRATION_TESTS === '1';

(runIntegration ? describe : describe.skip)('Clients / contracts (integration, real DB)', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let createClient: CreateClientUseCase;
  let createContract: CreateClientContractUseCase;

  beforeAll(() => {
    if (!process.env.DATABASE_URL?.trim()) {
      throw new Error('DATABASE_URL is required for integration tests');
    }
    const cwd = join(__dirname, '..');
    execSync('npx prisma migrate deploy', { cwd, stdio: 'inherit', env: process.env });
    execSync('npx prisma db seed', { cwd, stdio: 'inherit', env: process.env });
  });

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, expandVariables: true }),
        QueueModule,
        UsersModule,
        ClientsModule,
        ClientContractsModule,
      ],
    }).compile();

    await moduleRef.init();

    prisma = moduleRef.get(PrismaService);
    createClient = moduleRef.get(CreateClientUseCase);
    createContract = moduleRef.get(CreateClientContractUseCase);

    await prisma.$executeRawUnsafe('TRUNCATE TABLE "client_contracts" RESTART IDENTITY CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "clients" RESTART IDENTITY CASCADE');
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('creates client and enforces CPF uniqueness', async () => {
    await createClient.execute({
      name: 'A',
      cpf: '52998224725',
      address: integrationAddress,
      isForeignNational: false,
    });

    await expect(
      createClient.execute({
        name: 'B',
        cpf: '529.982.247-25',
        address: integrationAddress,
        isForeignNational: false,
      }),
    ).rejects.toMatchObject({ code: CLIENT_API_ERROR_CODES.CPF_ALREADY_REGISTERED });
  });

  it('creates contract with useClientAddress and rejects missing client', async () => {
    const client = await createClient.execute({
      name: 'Corp',
      cnpj: '11222333000181',
      address: integrationAddress,
      isForeignNational: false,
    });

    const contract = await createContract.execute({
      contractNumber: '2026-001',
      clientId: client.id,
      useClientAddress: true,
      startDate: '2025-01-01',
    });

    expect(contract.clientId).toBe(client.id);
    expect(contract.useClientAddress).toBe(true);

    await expect(
      createContract.execute({
        contractNumber: '2026-002',
        clientId: '00000000-0000-4000-8000-000000000001',
        useClientAddress: true,
        startDate: '2025-01-01',
      }),
    ).rejects.toMatchObject({ code: CONTRACT_API_ERROR_CODES.CLIENT_NOT_FOUND });
  });

  it('rejects contract when useClientAddress is false and address is omitted', async () => {
    const client = await createClient.execute({
      name: 'NoAddrContract',
      cnpj: '11222333000181',
      address: integrationAddress,
      isForeignNational: false,
    });

    const body: CreateClientContractBody = {
      contractNumber: '2026-NO-ADDR',
      clientId: client.id,
      useClientAddress: false,
      startDate: '2025-01-01',
    };

    await expect(createContract.execute(body)).rejects.toMatchObject({
      code: CONTRACT_API_ERROR_CODES.INVALID_DATA,
    });
  });

  it('prevents deleting client while a contract references it (FK restrict)', async () => {
    const client = await createClient.execute({
      name: 'WithContract',
      cnpj: '11222333000181',
      address: integrationAddress,
      isForeignNational: false,
    });

    await createContract.execute({
      contractNumber: '2026-FK',
      clientId: client.id,
      useClientAddress: true,
      startDate: '2025-01-01',
    });

    await expect(prisma.client.delete({ where: { uuid: client.id } })).rejects.toMatchObject({
      code: 'P2003',
    });
  });
});
