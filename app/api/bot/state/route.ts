import { NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';

export async function GET() {
  try {
    const state = await redis.get('bot:state');
    return NextResponse.json({
      status: 'success',
      data: state ? JSON.parse(state) : { isRunning: false, config: null }
    });
  } catch (error) {
    console.error('Error getting bot state:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to get bot state' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await redis.set('bot:state', JSON.stringify(body));
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error setting bot state:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to set bot state' }, { status: 500 });
  }
}
