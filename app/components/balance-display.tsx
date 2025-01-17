'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { XeggexApi } from "../api/xeggexApi"
import { EXCHANGE_API_KEY, EXCHANGE_SECRET_KEY } from "@/constants"
import { 
  PersonIcon,
} from "@radix-ui/react-icons"

import { CurrencyIcon } from "lucide-react"
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
      <Card className="bg-gray-900/50 border-gray-700 hover:bg-gray-800/50 transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">
            TLS Balance
            <span className="ml-2 text-xs font-normal text-gray-500">TLS</span>
          </CardTitle>
          <div className="rounded-full bg-purple-500/20 p-1">
            <PersonIcon className="h-4 w-4 text-purple-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <div className="text-2xl font-bold font-mono text-gray-100">
              {parseFloat(balances.tls.available).toFixed(8)}
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Available</span>
              <span className="font-mono text-gray-300">
                {parseFloat(balances.tls.available).toFixed(8)}
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ 
                  width: `${(parseFloat(balances.tls.available) / 
                    (parseFloat(balances.tls.available) + parseFloat(balances.tls.held))) * 100}%` 
                }}
              />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Locked</span>
              <span className="font-mono text-gray-300">
                {parseFloat(balances.tls.held).toFixed(8)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-gray-900/50 border-gray-700 hover:bg-gray-800/50 transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">
            USDT Balance
            <span className="ml-2 text-xs font-normal text-gray-500">USDT</span>
          </CardTitle>
          <div className="rounded-full bg-green-500/20 p-1">
            <CurrencyIcon className="h-4 w-4 text-green-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <div className="text-2xl font-bold font-mono text-gray-100">
              ${parseFloat(balances.usdt.available).toFixed(2)}
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Available</span>
              <span className="font-mono text-gray-300">
                ${parseFloat(balances.usdt.available).toFixed(2)}
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ 
                  width: `${(parseFloat(balances.usdt.available) / 
                    (parseFloat(balances.usdt.available) + parseFloat(balances.usdt.held))) * 100}%` 
                }}
              />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Locked</span>
              <span className="font-mono text-gray-300">
                ${parseFloat(balances.usdt.held).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
