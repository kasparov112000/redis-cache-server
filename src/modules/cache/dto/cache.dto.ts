import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsObject, Min } from 'class-validator';

export class SetCacheDto {
  @ApiProperty({ description: 'Cache key' })
  @IsString()
  key: string;

  @ApiProperty({ description: 'Value to cache (will be JSON serialized)' })
  @IsObject()
  value: any;

  @ApiPropertyOptional({ description: 'TTL in seconds', default: 86400 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  ttl?: number;
}

export class GetCacheDto {
  @ApiProperty({ description: 'Cache key' })
  @IsString()
  key: string;
}

export class DeleteCacheDto {
  @ApiProperty({ description: 'Cache key or pattern (use * for wildcard)' })
  @IsString()
  pattern: string;
}

export class CacheResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Cached data if found' })
  data?: any;

  @ApiPropertyOptional({ description: 'Cache hit status' })
  hit?: boolean;

  @ApiPropertyOptional({ description: 'TTL remaining in seconds' })
  ttl?: number;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  error?: string;
}

export class CacheStatsDto {
  @ApiProperty({ description: 'Redis connection status' })
  connected: boolean;

  @ApiProperty({ description: 'Total number of cached keys' })
  keyCount: number;

  @ApiProperty({ description: 'Memory usage' })
  memoryUsage: string;
}
