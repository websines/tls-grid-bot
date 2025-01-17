import Redis from 'ioredis';
import { GridConfig } from '@/constants';

export class RedisService {
  private static instance: RedisService;
  private redis: Redis;

  private constructor() {
    // Connect to Redis (update URL based on your Redis host)
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  // Bot State Management
  async setBotState(isRunning: boolean, config: GridConfig | null) {
    await this.redis.set('bot:state', JSON.stringify({
      isRunning,
      config,
      updatedAt: Date.now()
    }));
  }

  async getBotState() {
    const state = await this.redis.get('bot:state');
    if (!state) {
      return { isRunning: false, config: null };
    }
    return JSON.parse(state);
  }

  // Bot Orders Management
  async addBotOrder(orderId: string, symbol: string) {
    await this.redis.sadd(`bot:orders:${symbol}`, orderId);
  }

  async removeBotOrder(orderId: string, symbol: string) {
    await this.redis.srem(`bot:orders:${symbol}`, orderId);
  }

  async getBotOrders(symbol: string): Promise<string[]> {
    return await this.redis.smembers(`bot:orders:${symbol}`);
  }

  async clearBotOrders(symbol: string) {
    await this.redis.del(`bot:orders:${symbol}`);
  }

  // Statistics
  async updateStats(symbol: string, stats: any) {
    await this.redis.set(`bot:stats:${symbol}`, JSON.stringify({
      ...stats,
      updatedAt: Date.now()
    }));
  }

  async getStats(symbol: string) {
    const stats = await this.redis.get(`bot:stats:${symbol}`);
    return stats ? JSON.parse(stats) : null;
  }
}
