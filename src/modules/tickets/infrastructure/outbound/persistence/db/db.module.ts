import { Module } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaModule } from 'nestjs-prisma';

@Module({
  imports: [
    PrismaModule.forRootAsync({
      isGlobal: true,
      useFactory: () => {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString?.trim()) {
          throw new Error(
            'DATABASE_URL is not set or is empty. Check your .env or environment.',
          );
        }
        const adapter = new PrismaPg({ connectionString });
        return {
          prismaOptions: { adapter },
          explicitConnect: true,
        };
      },
    }),
  ],
})
export class DbModule {}
