import { NextResponse } from 'next/server'
import DBService from '@/app/services/dbService'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')

  if (!symbol) {
    return NextResponse.json({ 
      status: 'error',
      message: 'Symbol parameter is required'
    }, { status: 400 })
  }

  try {
    const db = await DBService.getInstance()
    const orders = await db.getBotOrders(symbol)
    const stats = await db.getStats()

    return NextResponse.json({
      status: 'success',
      data: orders,
      stats
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ 
      status: 'error',
      message: 'Failed to fetch orders'
    }, { status: 500 })
  }
}
