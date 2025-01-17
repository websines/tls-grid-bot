import { NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ status: 'error', message: 'Symbol is required' }, { status: 400 });
    }

    const orders = await redis.smembers(`bot:orders:${symbol}`);
    return NextResponse.json({ status: 'success', data: orders });
  } catch (error) {
    console.error('Error getting bot orders:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to get bot orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { symbol, orderId } = await request.json();
    
    if (!symbol || !orderId) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Symbol and orderId are required' 
      }, { status: 400 });
    }

    await redis.sadd(`bot:orders:${symbol}`, orderId);
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error adding bot order:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to add bot order' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { symbol, orderId } = await request.json();
    
    if (!symbol || !orderId) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Symbol and orderId are required' 
      }, { status: 400 });
    }

    await redis.srem(`bot:orders:${symbol}`, orderId);
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error removing bot order:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to remove bot order' }, { status: 500 });
  }
}
