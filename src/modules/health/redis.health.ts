import { Injectable, Logger } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { RedisService } from '../cache/services/redis.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(RedisHealthIndicator.name);

  constructor(private redisService: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
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

      // Return degraded status instead of failing completely
      this.logger.warn('Redis not connected - service running in degraded mode');
      return this.getStatus(key, true, {
        connected: false,
        status: 'degraded',
        message: 'Redis unavailable - caching disabled',
      });
    } catch (error) {
      this.logger.warn(`Redis health check error: ${error.message}`);
      // Return degraded instead of throwing to allow service to start
      return this.getStatus(key, true, {
        connected: false,
        status: 'degraded',
        error: error.message,
      });
    }
  }
}
