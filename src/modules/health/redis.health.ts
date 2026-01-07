import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { RedisService } from '../cache/services/redis.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private redisService: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isHealthy = await this.redisService.ping();
    const stats = await this.redisService.getStats();

    const result = this.getStatus(key, isHealthy, {
      connected: stats.connected,
      keyCount: stats.keyCount,
      memoryUsage: stats.memoryUsage,
    });

    if (isHealthy) {
      return result;
    }

    throw new HealthCheckError('Redis check failed', result);
  }
}
