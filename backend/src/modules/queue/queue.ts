import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { getRedisConnectionOptions } from '../../common/redis/redis-connection.options';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: getRedisConnectionOptions(),
      }),
    }),
  ],
})
export class QueueModule {}
