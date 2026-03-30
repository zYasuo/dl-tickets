import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaModule } from 'nestjs-prisma';

@Module({
  imports: [
    PrismaModule.forRootAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.getOrThrow<string>('DATABASE_URL');
        const adapter = new PrismaPg({ connectionString });
        return {
          prismaOptions: { adapter },
          explicitConnect: true,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DbModule {}
