import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GridTradingService } from '../services/gridTradingService';

interface BotStats {
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

export function BotStats({ symbol }: { symbol: string }) {
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const gridService = GridTradingService.getInstance()
        const stats = await gridService.getStats(symbol)
        setStats(stats)
        setError(null)
      } catch (error) {
        console.error('Error fetching stats:', error)
        setError('Failed to load statistics')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [symbol])

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-700/50 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-900/20 border border-red-500/50 p-4 text-red-300">
        {error}
      </div>
    )
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(num)
  }

  const formatProfit = (profit: number) => {
    const formatted = formatNumber(Math.abs(profit))
    return profit >= 0 ? `+${formatted}` : `-${formatted}`
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg bg-gray-900/50 border border-gray-700 p-4 transition-all duration-300 hover:bg-gray-900/70">
          <div className="text-sm text-gray-400 mb-1">Total Profit</div>
          <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatProfit(stats.totalProfit)} USDT
          </div>
        </div>

        <div className="rounded-lg bg-gray-900/50 border border-gray-700 p-4 transition-all duration-300 hover:bg-gray-900/70">
          <div className="text-sm text-gray-400 mb-1">Total Trades</div>
          <div className="text-2xl font-bold text-cyan-300">
            {stats.trades || 0}
          </div>
        </div>

        <div className="rounded-lg bg-gray-900/50 border border-gray-700 p-4 transition-all duration-300 hover:bg-gray-900/70">
          <div className="text-sm text-gray-400 mb-1">24h Volume</div>
          <div className="text-2xl font-bold text-cyan-300">
            {formatNumber(stats.volume24h || 0)} USDT
          </div>
        </div>

        <div className="rounded-lg bg-gray-900/50 border border-gray-700 p-4 transition-all duration-300 hover:bg-gray-900/70">
          <div className="text-sm text-gray-400 mb-1">Success Rate</div>
          <div className="text-2xl font-bold text-cyan-300">
            {stats.trades ? ((stats.profitableTrades / stats.trades) * 100).toFixed(1) : '0'}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg bg-gray-900/50 border border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Price Range (24h)</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Highest</span>
              <span className="font-mono text-green-400">{formatNumber(stats.highestPrice || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Lowest</span>
              <span className="font-mono text-red-400">{formatNumber(stats.lowestPrice || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Current</span>
              <span className="font-mono text-cyan-300">{formatNumber(stats.lastTradePrice || 0)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-gray-900/50 border border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Last Trade</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Type</span>
              <span className={stats.lastTradeType === 'buy' ? 'text-green-400' : 'text-red-400'}>
                {stats.lastTradeType?.toUpperCase() || '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Price</span>
              <span className="font-mono text-cyan-300">{formatNumber(stats.lastTradePrice || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Time</span>
              <span className="text-gray-300">
                {stats.lastTradeTime ? new Date(stats.lastTradeTime).toLocaleTimeString() : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
