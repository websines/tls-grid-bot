'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { XeggexApi } from "../api/xeggexApi"

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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Last Price</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${parseFloat(marketData.lastPrice).toFixed(8)}</div>
          <p className="text-xs text-muted-foreground">USDT</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${parseFloat(marketData.volume24h).toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">USDT</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">24h High</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${parseFloat(marketData.high24h).toFixed(8)}</div>
          <p className="text-xs text-muted-foreground">USDT</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">24h Low</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${parseFloat(marketData.low24h).toFixed(8)}</div>
          <p className="text-xs text-muted-foreground">USDT</p>
        </CardContent>
      </Card>
    </div>
  )
}
