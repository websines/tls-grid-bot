'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { XeggexApi } from "../api/xeggexApi"
import { 
  ArrowUpIcon, 
  ArrowDownIcon,
  BarChartIcon,

} from "@radix-ui/react-icons"
import { CurrencyIcon } from "lucide-react"
export function MarketOverview() {
  const [marketData, setMarketData] = useState({
    lastPrice: "0",
    volume24h: "0",
    high24h: "0",
    low24h: "0",
  })

  useEffect(() => {
    const fetchMarketData = async () => {
      const api = new XeggexApi()
      const ticker = await api.getTicker("TLS/USDT")
      setMarketData({
        lastPrice: ticker.last_price,
        volume24h: ticker.usd_volume_est,
        high24h: ticker.high,
        low24h: ticker.low,
      })
    }

    fetchMarketData()
    const interval = setInterval(fetchMarketData, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      <Card className="bg-gray-900/50 border-gray-700 hover:bg-gray-800/50 transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium text-gray-400">Last Price</CardTitle>
            <p className="text-xs text-gray-500">USDT</p>
          </div>
          <div className="rounded-full bg-green-500/20 p-2">
            <CurrencyIcon className="h-5 w-5 text-green-400" strokeWidth={1.5} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-2xl font-bold font-mono text-gray-100">
              ${parseFloat(marketData.lastPrice).toFixed(8)}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-green-400">+2.5%</span>
              <span className="text-xs text-gray-500">vs 24h ago</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900/50 border-gray-700 hover:bg-gray-800/50 transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium text-gray-400">24h Volume</CardTitle>
            <p className="text-xs text-gray-500">USDT</p>
          </div>
          <div className="rounded-full bg-blue-500/20 p-2">
            <BarChartIcon className="h-5 w-5 text-blue-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-2xl font-bold font-mono text-gray-100">
              ${parseFloat(marketData.volume24h).toFixed(2)}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-blue-400">+5.3%</span>
              <span className="text-xs text-gray-500">vs previous 24h</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900/50 border-gray-700 hover:bg-gray-800/50 transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium text-gray-400">24h High</CardTitle>
            <p className="text-xs text-gray-500">USDT</p>
          </div>
          <div className="rounded-full bg-green-500/20 p-2">
            <ArrowUpIcon className="h-5 w-5 text-green-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-2xl font-bold font-mono text-gray-100">
              ${parseFloat(marketData.high24h).toFixed(8)}
            </div>
            <div className="mt-2 h-2 w-full bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ 
                  width: `${((parseFloat(marketData.lastPrice) - parseFloat(marketData.low24h)) / 
                  (parseFloat(marketData.high24h) - parseFloat(marketData.low24h))) * 100}%` 
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900/50 border-gray-700 hover:bg-gray-800/50 transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium text-gray-400">24h Low</CardTitle>
            <p className="text-xs text-gray-500">USDT</p>
          </div>
          <div className="rounded-full bg-red-500/20 p-2">
            <ArrowDownIcon className="h-5 w-5 text-red-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-2xl font-bold font-mono text-gray-100">
              ${parseFloat(marketData.low24h).toFixed(8)}
            </div>
            <div className="mt-2 h-2 w-full bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 rounded-full transition-all"
                style={{ 
                  width: `${((parseFloat(marketData.lastPrice) - parseFloat(marketData.low24h)) / 
                  (parseFloat(marketData.high24h) - parseFloat(marketData.low24h))) * 100}%` 
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
