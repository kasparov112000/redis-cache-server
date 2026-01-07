import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

export interface LichessExplorerResponse {
  white: number;
  draws: number;
  black: number;
  moves: LichessMove[];
  topGames?: LichessGame[];
  opening?: {
    eco: string;
    name: string;
  };
}

export interface LichessMove {
  uci: string;
  san: string;
  white: number;
  draws: number;
  black: number;
  averageRating?: number;
}

export interface LichessGame {
  id: string;
  winner?: 'white' | 'black';
  white: { name: string; rating: number };
  black: { name: string; rating: number };
  year?: number;
}

@Injectable()
export class LichessCacheService {
  private readonly logger = new Logger(LichessCacheService.name);
  private readonly ttl: number;

  constructor(
    private redisService: RedisService,
    private configService: ConfigService,
  ) {
    this.ttl = this.configService.get('cache.lichessTtl');
    this.logger.log(`Lichess cache TTL: ${this.ttl} seconds (${this.ttl / 86400} days)`);
  }

  private getCacheKey(fen: string, database: string): string {
    // Normalize FEN for consistent caching (remove move counters if present)
    const normalizedFen = this.normalizeFen(fen);
    return `lichess:explorer:${database}:${normalizedFen}`;
  }

  private normalizeFen(fen: string): string {
    // Replace spaces and special chars for Redis key compatibility
    return fen.replace(/\s+/g, '_').replace(/\//g, '-');
  }

  async getOpeningMoves(
    fen: string,
    database: 'masters' | 'lichess' = 'masters',
  ): Promise<LichessExplorerResponse | null> {
    const key = this.getCacheKey(fen, database);
    const cached = await this.redisService.get<LichessExplorerResponse>(key);

    if (cached) {
      this.logger.debug(`Cache HIT for ${database} explorer: ${fen.substring(0, 30)}...`);
      return cached;
    }

    this.logger.debug(`Cache MISS for ${database} explorer: ${fen.substring(0, 30)}...`);
    return null;
  }

  async setOpeningMoves(
    fen: string,
    database: 'masters' | 'lichess',
    data: LichessExplorerResponse,
  ): Promise<boolean> {
    const key = this.getCacheKey(fen, database);
    const success = await this.redisService.set(key, data, this.ttl);

    if (success) {
      this.logger.debug(`Cached ${database} explorer for: ${fen.substring(0, 30)}...`);
    }

    return success;
  }

  async invalidatePosition(fen: string): Promise<boolean> {
    const normalizedFen = this.normalizeFen(fen);
    const mastersKey = `lichess:explorer:masters:${normalizedFen}`;
    const lichessKey = `lichess:explorer:lichess:${normalizedFen}`;

    const mastersDeleted = await this.redisService.delete(mastersKey);
    const lichessDeleted = await this.redisService.delete(lichessKey);

    return mastersDeleted || lichessDeleted;
  }

  async invalidateAll(): Promise<number> {
    return await this.redisService.flush('lichess:*');
  }

  async getStats(): Promise<{
    mastersCount: number;
    lichessCount: number;
    totalCount: number;
  }> {
    const mastersKeys = await this.redisService.keys('lichess:explorer:masters:*');
    const lichessKeys = await this.redisService.keys('lichess:explorer:lichess:*');

    return {
      mastersCount: mastersKeys.length,
      lichessCount: lichessKeys.length,
      totalCount: mastersKeys.length + lichessKeys.length,
    };
  }

  async getCacheInfo(fen: string, database: 'masters' | 'lichess'): Promise<{
    exists: boolean;
    ttl: number;
    data: LichessExplorerResponse | null;
  }> {
    const key = this.getCacheKey(fen, database);
    const exists = await this.redisService.exists(key);
    const ttl = await this.redisService.getTtl(key);
    const data = exists ? await this.redisService.get<LichessExplorerResponse>(key) : null;

    return { exists, ttl, data };
  }
}
