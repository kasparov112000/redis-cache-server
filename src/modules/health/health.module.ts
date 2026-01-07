import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { CacheModule } from '../cache/cache.module';
import { RedisHealthIndicator } from './redis.health';

@Module({
  imports: [TerminusModule, CacheModule],
  controllers: [HealthController],
  providers: [RedisHealthIndicator],
})
export class HealthModule {}
