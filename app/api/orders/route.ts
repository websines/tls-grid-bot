import { NextResponse } from 'next/server';
import { GridTradingService } from '@/app/services/gridTradingService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ status: 'error', message: 'Symbol is required' }, { status: 400 });
    }

    const gridService = GridTradingService.getInstance();
    const status = await gridService.getStatus();

    return NextResponse.json({ status: 'success', data: status });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to fetch orders' }, { status: 500 });
  }
}
