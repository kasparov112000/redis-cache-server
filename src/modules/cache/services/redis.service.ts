import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private keyPrefix: string;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisConfig = this.configService.get('redis');
    this.keyPrefix = redisConfig.keyPrefix;

    try {
      this.client = new Redis({
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
        db: redisConfig.db,
        retryStrategy: (times) => {
          if (times > 10) {
            this.logger.warn('Max Redis reconnection attempts reached');
            return null; // Stop retrying
          }
          const delay = Math.min(times * 100, 3000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        lazyConnect: true, // Don't fail on startup if Redis unavailable
        enableReadyCheck: false,
        connectTimeout: 5000,
      });

      this.client.on('connect', () => {
        this.logger.log('Connected to Redis');
      });

      this.client.on('error', (error) => {
        this.logger.warn(`Redis error: ${error.message}`);
      });

      this.client.on('ready', () => {
        this.logger.log('Redis client ready');
      });

      // Try to connect but don't fail if Redis is unavailable
      await this.client.connect().catch((err) => {
        this.logger.warn(`Could not connect to Redis: ${err.message}. Service will run in degraded mode.`);
      });
    } catch (error) {
      this.logger.warn(`Failed to initialize Redis client: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis connection closed');
    }
  }

  private getKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(this.getKey(key));
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      this.logger.error(`Error getting key ${key}: ${error.message}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      const fullKey = this.getKey(key);

      if (ttlSeconds) {
        await this.client.setex(fullKey, ttlSeconds, serialized);
      } else {
        await this.client.set(fullKey, serialized);
      }
      return true;
    } catch (error) {
      this.logger.error(`Error setting key ${key}: ${error.message}`);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.client.del(this.getKey(key));
      return true;
    } catch (error) {
      this.logger.error(`Error deleting key ${key}: ${error.message}`);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(this.getKey(key));
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking existence of key ${key}: ${error.message}`);
      return false;
    }
  }

  async getTtl(key: string): Promise<number> {
    try {
      return await this.client.ttl(this.getKey(key));
    } catch (error) {
      this.logger.error(`Error getting TTL for key ${key}: ${error.message}`);
      return -1;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      const fullPattern = this.getKey(pattern);
      const keys = await this.client.keys(fullPattern);
      // Remove prefix from returned keys
      return keys.map((k) => k.replace(this.keyPrefix, ''));
    } catch (error) {
      this.logger.error(`Error getting keys for pattern ${pattern}: ${error.message}`);
      return [];
    }
  }

  async flush(pattern?: string): Promise<number> {
    try {
      if (pattern) {
        const keys = await this.client.keys(this.getKey(pattern));
        if (keys.length === 0) return 0;
        return await this.client.del(...keys);
      } else {
        // Only flush keys with our prefix
        const keys = await this.client.keys(this.getKey('*'));
        if (keys.length === 0) return 0;
        return await this.client.del(...keys);
      }
    } catch (error) {
      this.logger.error(`Error flushing keys: ${error.message}`);
      return 0;
    }
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }

  async getStats(): Promise<{
    connected: boolean;
    keyCount: number;
    memoryUsage: string;
  }> {
    try {
      const connected = await this.ping();
      const keys = await this.client.keys(this.getKey('*'));
      const info = await this.client.info('memory');
      const memoryMatch = info.match(/used_memory_human:(\S+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1] : 'unknown';

      return {
        connected,
        keyCount: keys.length,
        memoryUsage,
      };
    } catch (error) {
      return {
        connected: false,
        keyCount: 0,
        memoryUsage: 'unknown',
      };
    }
  }
}
