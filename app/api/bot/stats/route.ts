import { NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';

export interface BotStats {
  totalProfit: number;
  totalTrades: number;
  profitableTrades: number;
  lastTradeTime?: number;
  lastTradePrice?: number;
  lastTradeType?: 'buy' | 'sell';
  highestPrice: number;
  lowestPrice: number;
  volume24h: number;
  updatedAt: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ status: 'error', message: 'Symbol is required' }, { status: 400 });
    }

    const stats = await redis.hgetall(`bot:stats:${symbol}`);
    if (!stats || Object.keys(stats).length === 0) {
      const initialStats: BotStats = {
        totalProfit: 0,
        totalTrades: 0,
        profitableTrades: 0,
        highestPrice: 0,
        lowestPrice: 0,
        volume24h: 0,
        updatedAt: Date.now()
      };
      return NextResponse.json({ status: 'success', data: initialStats });
    }

    // Convert numeric strings to numbers
    const parsedStats: BotStats = {
      totalProfit: parseFloat(stats.totalProfit),
      totalTrades: parseInt(stats.totalTrades),
      profitableTrades: parseInt(stats.profitableTrades),
      lastTradeTime: stats.lastTradeTime ? parseInt(stats.lastTradeTime) : undefined,
      lastTradePrice: stats.lastTradePrice ? parseFloat(stats.lastTradePrice) : undefined,
      lastTradeType: stats.lastTradeType as 'buy' | 'sell' | undefined,
      highestPrice: parseFloat(stats.highestPrice),
      lowestPrice: parseFloat(stats.lowestPrice),
      volume24h: parseFloat(stats.volume24h),
      updatedAt: parseInt(stats.updatedAt)
    };

    return NextResponse.json({ status: 'success', data: parsedStats });
  } catch (error) {
    console.error('Error getting bot stats:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to get bot stats' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { symbol, stats } = await request.json();
    
    if (!symbol || !stats) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Symbol and stats are required' 
      }, { status: 400 });
    }

    const key = `bot:stats:${symbol}`;
    await redis.hmset(key, {
      ...stats,
      updatedAt: Date.now().toString()
    });

    // Set expiry for 24h volume
    const volume24hKey = `bot:volume:${symbol}:24h`;
    await redis.set(volume24hKey, stats.volume24h.toString(), 'EX', 86400); // 24 hours

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error updating bot stats:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to update bot stats' }, { status: 500 });
  }
}
