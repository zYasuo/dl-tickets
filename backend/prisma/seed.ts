import { PrismaClient } from '@prisma/client';

/** Dev-only geography; fixed UUIDs are convenient for local seeds and tests — replace with your import when you own production data. */
const prisma = new PrismaClient();

async function main(): Promise<void> {
  const br = await prisma.country.upsert({
    where: { uuid: '00000000-0000-4000-8000-000000000001' },
    create: {
      uuid: '00000000-0000-4000-8000-000000000001',
      name: 'Brasil',
    },
    update: { name: 'Brasil' },
  });

  const sp = await prisma.state.upsert({
    where: { uuid: '00000000-0000-4000-8000-000000000010' },
    create: {
      uuid: '00000000-0000-4000-8000-000000000010',
      name: 'São Paulo',
      code: 'SP',
      countryId: br.id,
    },
    update: { name: 'São Paulo', code: 'SP', countryId: br.id },
  });

  const rj = await prisma.state.upsert({
    where: { uuid: '00000000-0000-4000-8000-000000000011' },
    create: {
      uuid: '00000000-0000-4000-8000-000000000011',
      name: 'Rio de Janeiro',
      code: 'RJ',
      countryId: br.id,
    },
    update: { name: 'Rio de Janeiro', code: 'RJ', countryId: br.id },
  });

  await prisma.city.upsert({
    where: { uuid: '00000000-0000-4000-8000-000000000020' },
    create: {
      uuid: '00000000-0000-4000-8000-000000000020',
      name: 'São Paulo',
      stateId: sp.id,
    },
    update: { name: 'São Paulo', stateId: sp.id },
  });

  await prisma.city.upsert({
    where: { uuid: '00000000-0000-4000-8000-000000000021' },
    create: {
      uuid: '00000000-0000-4000-8000-000000000021',
      name: 'Campinas',
      stateId: sp.id,
    },
    update: { name: 'Campinas', stateId: sp.id },
  });

  await prisma.city.upsert({
    where: { uuid: '00000000-0000-4000-8000-000000000022' },
    create: {
      uuid: '00000000-0000-4000-8000-000000000022',
      name: 'Rio de Janeiro',
      stateId: rj.id,
    },
    update: { name: 'Rio de Janeiro', stateId: rj.id },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
