import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDISCLOUD_URL');
        const environment = configService.get<string>('Environment');

        if(environment === "Production") {
          return {
            connection: {
              host: configService.get<string>('REDIS_HOST', 'localhost'),
              port: configService.get<number>('REDIS_PORT', 6379),
              password: configService.get<string>('REDIS_PASSWORD', ''),
              maxRetriesPerRequest: null,
            },
          };
        } else {
          if (redisUrl) {
            return {
              connection: {
                connectionString: redisUrl,
                maxRetriesPerRequest: null,
              },
  
            };
          } else {
            return {
              connection: {
                host: configService.get<string>('REDIS_HOST', 'localhost'),
                port: configService.get<number>('REDIS_PORT', 6379),
                maxRetriesPerRequest: null,
              },
            };
          }
        }
      },
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}