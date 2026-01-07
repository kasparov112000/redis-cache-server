import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional, IsObject } from 'class-validator';

export class LichessMoveDto {
  @ApiProperty({ description: 'Move in UCI notation' })
  uci: string;

  @ApiProperty({ description: 'Move in SAN notation' })
  san: string;

  @ApiProperty({ description: 'White wins after this move' })
  white: number;

  @ApiProperty({ description: 'Draws after this move' })
  draws: number;

  @ApiProperty({ description: 'Black wins after this move' })
  black: number;

  @ApiPropertyOptional({ description: 'Average rating of players who played this' })
  averageRating?: number;
}

export class LichessExplorerDataDto {
  @ApiProperty({ description: 'White wins count' })
  white: number;

  @ApiProperty({ description: 'Draws count' })
  draws: number;

  @ApiProperty({ description: 'Black wins count' })
  black: number;

  @ApiProperty({ description: 'Available moves', type: [LichessMoveDto] })
  moves: LichessMoveDto[];

  @ApiPropertyOptional({ description: 'Opening information' })
  opening?: {
    eco: string;
    name: string;
  };
}

export class LichessExplorerQueryDto {
  @ApiProperty({ description: 'FEN string of the position' })
  @IsString()
  fen: string;

  @ApiPropertyOptional({
    description: 'Database to query',
    enum: ['masters', 'lichess'],
    default: 'masters',
  })
  @IsOptional()
  @IsIn(['masters', 'lichess'])
  database?: 'masters' | 'lichess';
}

export class LichessExplorerSetDto {
  @ApiProperty({ description: 'FEN string of the position' })
  @IsString()
  fen: string;

  @ApiProperty({
    description: 'Database type',
    enum: ['masters', 'lichess'],
  })
  @IsIn(['masters', 'lichess'])
  database: 'masters' | 'lichess';

  @ApiProperty({ description: 'Lichess explorer response data', type: LichessExplorerDataDto })
  @IsObject()
  data: LichessExplorerDataDto;
}

export class LichessCacheStatsDto {
  @ApiProperty({ description: 'Number of cached master game positions' })
  mastersCount: number;

  @ApiProperty({ description: 'Number of cached lichess game positions' })
  lichessCount: number;

  @ApiProperty({ description: 'Total cached positions' })
  totalCount: number;
}

export class LichessCacheInfoDto {
  @ApiProperty({ description: 'Whether cache exists for this position' })
  exists: boolean;

  @ApiProperty({ description: 'TTL remaining in seconds (-1 if no expiry, -2 if not found)' })
  ttl: number;

  @ApiPropertyOptional({ description: 'Cached data if exists', type: LichessExplorerDataDto })
  data?: LichessExplorerDataDto;
}
