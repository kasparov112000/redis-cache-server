import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { LichessCacheService } from '../services/lichess-cache.service';
import {
  LichessExplorerQueryDto,
  LichessExplorerSetDto,
  LichessCacheStatsDto,
  LichessCacheInfoDto,
  LichessExplorerDataDto,
} from '../dto/lichess.dto';

@ApiTags('lichess')
@Controller('lichess')
export class LichessController {
  constructor(private lichessCacheService: LichessCacheService) {}

  @Get('explorer')
  @ApiOperation({ summary: 'Get cached Lichess explorer data for a position' })
  @ApiQuery({ name: 'fen', required: true, description: 'FEN string' })
  @ApiQuery({ name: 'database', required: false, enum: ['masters', 'lichess'] })
  @ApiResponse({ status: 200, type: LichessExplorerDataDto })
  async getExplorer(
    @Query() query: LichessExplorerQueryDto,
  ): Promise<{ hit: boolean; data: LichessExplorerDataDto | null }> {
    const data = await this.lichessCacheService.getOpeningMoves(
      query.fen,
      query.database || 'masters',
    );

    return {
      hit: data !== null,
      data,
    };
  }

  @Post('explorer')
  @ApiOperation({ summary: 'Cache Lichess explorer data for a position' })
  @ApiResponse({ status: 201, description: 'Data cached successfully' })
  async setExplorer(
    @Body() dto: LichessExplorerSetDto,
  ): Promise<{ success: boolean }> {
    const success = await this.lichessCacheService.setOpeningMoves(
      dto.fen,
      dto.database,
      dto.data,
    );

    return { success };
  }

  @Delete('explorer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invalidate cached data for a position' })
  @ApiQuery({ name: 'fen', required: true, description: 'FEN string to invalidate' })
  @ApiResponse({ status: 200, description: 'Cache invalidated' })
  async invalidatePosition(
    @Query('fen') fen: string,
  ): Promise<{ invalidated: boolean }> {
    const invalidated = await this.lichessCacheService.invalidatePosition(fen);
    return { invalidated };
  }

  @Delete('explorer/all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invalidate all Lichess cached data' })
  @ApiResponse({ status: 200, description: 'All Lichess cache cleared' })
  async invalidateAll(): Promise<{ deleted: number }> {
    const deleted = await this.lichessCacheService.invalidateAll();
    return { deleted };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get Lichess cache statistics' })
  @ApiResponse({ status: 200, type: LichessCacheStatsDto })
  async getStats(): Promise<LichessCacheStatsDto> {
    return await this.lichessCacheService.getStats();
  }

  @Get('info')
  @ApiOperation({ summary: 'Get detailed cache info for a position' })
  @ApiQuery({ name: 'fen', required: true, description: 'FEN string' })
  @ApiQuery({ name: 'database', required: false, enum: ['masters', 'lichess'] })
  @ApiResponse({ status: 200, type: LichessCacheInfoDto })
  async getCacheInfo(
    @Query() query: LichessExplorerQueryDto,
  ): Promise<LichessCacheInfoDto> {
    return await this.lichessCacheService.getCacheInfo(
      query.fen,
      query.database || 'masters',
    );
  }
}
