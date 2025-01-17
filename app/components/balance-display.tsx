'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { XeggexApi } from "../api/xeggexApi"
import { EXCHANGE_API_KEY, EXCHANGE_SECRET_KEY } from "@/constants"

export function BalanceDisplay() {
  const [balances, setBalances] = useState({
    tls: { available: "0", held: "0" },
    usdt: { available: "0", held: "0" },
  })

  useEffect(() => {
    const fetchBalances = async () => {
      const api = new XeggexApi(
        EXCHANGE_API_KEY, EXCHANGE_SECRET_KEY
      )
      try {
        const balanceData = await api.getBalances()
        const tls = balanceData.find((b: any) => b.asset === "TLS") || { available: "0", locked: "0" }
        const usdt = balanceData.find((b: any) => b.asset === "USDT") || { available: "0", locked: "0" }
        setBalances({ tls, usdt })
      } catch (error) {
        console.error('Error fetching balances:', error)
      }
    }

    fetchBalances()
    const interval = setInterval(fetchBalances, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">TLS Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{parseFloat(balances.tls.available).toFixed(8)}</div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Available</span>
            <span>Locked: {parseFloat(balances.tls.held).toFixed(8)}</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">USDT Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${parseFloat(balances.usdt.available).toFixed(2)}</div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Available</span>
            <span>Locked: ${parseFloat(balances.usdt.held).toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
