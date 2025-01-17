'use client'
import { useState } from "react"
import { MarketOverview } from "./components/market-overview"
import { BalanceDisplay } from "./components/balance-display"
import { GridConfigForm } from "./components/grid-config-form"
import { Button } from "@/components/ui/button"
import { GridConfig, GridTradingService } from "./services/gridTradingService"
import { OrdersTable } from "./components/orders-table"

export default function Home() {
  const [isRunning, setIsRunning] = useState(false)
  const [gridService] = useState(() => new GridTradingService())

  const handleConfigSubmit = async (config: GridConfig) => {
    try {
      await gridService.startGrid(config)
      setIsRunning(true)
    } catch (error) {
      console.error("Failed to start grid:", error)
      alert(error instanceof Error ? error.message : "Failed to start grid")
    }
  }

  const handleStopBot = async () => {
    try {
      await gridService.stopGrid()
      setIsRunning(false)
    } catch (error) {
      console.error("Failed to stop grid:", error)
      alert(error instanceof Error ? error.message : "Failed to stop grid")
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">TLS Grid Trading Bot</h1>
          {isRunning && (
            <Button 
              variant="destructive" 
              onClick={handleStopBot}
              className="px-8"
            >
              Stop Bot
            </Button>
          )}
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">Market Overview</h2>
            <MarketOverview />
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Account Balance</h2>
            <BalanceDisplay />
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Grid Configuration</h2>
            <GridConfigForm onSubmit={handleConfigSubmit} isRunning={isRunning} />
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Bot Orders</h2>
            <OrdersTable symbol="TLS/USDT" />
          </section>
        </div>
      </div>
    </div>
  )
}
