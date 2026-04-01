import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { PrismaService } from 'nestjs-prisma';
import { CreateClientUseCase } from '../src/modules/clients/application/use-cases/create-client.use-case';
import { ClientsModule } from '../src/modules/clients/clients.module';
import { CreateClientContractUseCase } from '../src/modules/client-contracts/application/use-cases/create-client-contract.use-case';
import { ClientContractsModule } from '../src/modules/client-contracts/client-contracts.module';
import { UsersModule } from '../src/modules/users/users.module';

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
  });

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, expandVariables: true }),
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
    const address = {
      street: 'Rua X',
      number: '1',
      neighborhood: 'N',
      city: 'C',
      state: 'SP',
      zipCode: '01310100',
    };

    await createClient.execute({
      name: 'A',
      cpf: '52998224725',
      address,
    });

    await expect(
      createClient.execute({
        name: 'B',
        cpf: '529.982.247-25',
        address,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates contract with useClientAddress and rejects missing client', async () => {
    const address = {
      street: 'Rua X',
      number: '1',
      neighborhood: 'N',
      city: 'C',
      state: 'SP',
      zipCode: '01310100',
    };

    const client = await createClient.execute({
      name: 'Corp',
      cnpj: '11222333000181',
      address,
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
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
