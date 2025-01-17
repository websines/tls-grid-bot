import { NextResponse } from 'next/server';
import { XeggexApi } from '../xeggexApi';

const api = new XeggexApi(
  process.env.EXCHANGE_API_KEY,
  process.env.EXCHANGE_SECRET_KEY
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'TLS/USDT';

    const [ticker, balances, openOrders] = await Promise.all([
      api.getTicker(symbol),
      api.getBalances(),
      api.getOpenOrders(symbol)
    ]);

    const tlsBalance = balances.find((b: any) => b.asset === 'TLS');
    const usdtBalance = balances.find((b: any) => b.asset === 'USDT');

    console.log(tlsBalance, usdtBalance)
    return NextResponse.json({
      status: 'success',
      data: {
        ticker,
        balances: {
          tls: tlsBalance || null,
          usdt: usdtBalance || null
        },
        openOrders: openOrders || []
      }
    });
  } catch (error) {
    console.error('Market API Error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
