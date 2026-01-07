import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../services/redis.service';
import {
  SetCacheDto,
  CacheResponseDto,
  CacheStatsDto,
} from '../dto/cache.dto';

@ApiTags('cache')
@Controller('cache')
export class CacheController {
  constructor(
    private redisService: RedisService,
    private configService: ConfigService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get cache statistics' })
  @ApiResponse({ status: 200, type: CacheStatsDto })
  async getStats(): Promise<CacheStatsDto> {
    return await this.redisService.getStats();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get cached value by key' })
  @ApiResponse({ status: 200, type: CacheResponseDto })
  async get(@Param('key') key: string): Promise<CacheResponseDto> {
    const data = await this.redisService.get(key);
    const ttl = await this.redisService.getTtl(key);

    return {
      success: true,
      hit: data !== null,
      data,
      ttl: ttl > 0 ? ttl : undefined,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Set cache value' })
  @ApiResponse({ status: 201, type: CacheResponseDto })
  async set(@Body() dto: SetCacheDto): Promise<CacheResponseDto> {
    const defaultTtl = this.configService.get<number>('cache.defaultTtl');
    const success = await this.redisService.set(
      dto.key,
      dto.value,
      dto.ttl || defaultTtl,
    );

    return {
      success,
      error: success ? undefined : 'Failed to set cache value',
    };
  }

  @Delete(':key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete cached value by key' })
  @ApiResponse({ status: 200, type: CacheResponseDto })
  async delete(@Param('key') key: string): Promise<CacheResponseDto> {
    const success = await this.redisService.delete(key);
    return { success };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Flush cache by pattern' })
  @ApiResponse({ status: 200, description: 'Number of keys deleted' })
  async flush(@Query('pattern') pattern?: string): Promise<{ deleted: number }> {
    const deleted = await this.redisService.flush(pattern || '*');
    return { deleted };
  }

  @Get('keys/:pattern')
  @ApiOperation({ summary: 'List keys matching pattern' })
  @ApiResponse({ status: 200, type: [String] })
  async keys(@Param('pattern') pattern: string): Promise<string[]> {
    return await this.redisService.keys(pattern);
  }

  @Get('exists/:key')
  @ApiOperation({ summary: 'Check if key exists' })
  @ApiResponse({ status: 200, type: Boolean })
  async exists(@Param('key') key: string): Promise<{ exists: boolean }> {
    const exists = await this.redisService.exists(key);
    return { exists };
  }
}
