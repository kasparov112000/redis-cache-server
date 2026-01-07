import { Module } from '@nestjs/common';
import { RedisService } from './services/redis.service';
import { LichessCacheService } from './services/lichess-cache.service';
import { CacheController } from './controllers/cache.controller';
import { LichessController } from './controllers/lichess.controller';

@Module({
  controllers: [CacheController, LichessController],
  providers: [RedisService, LichessCacheService],
  exports: [RedisService, LichessCacheService],
})
export class CacheModule {}
