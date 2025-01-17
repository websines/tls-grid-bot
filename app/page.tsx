'use client'
import { useEffect, useState } from "react"
import { MarketOverview } from "./components/market-overview"
import { BalanceDisplay } from "./components/balance-display"
import { GridConfigForm } from "./components/grid-config-form"
import { Button } from "@/components/ui/button"
import { GridConfig } from "@/constants"
import { GridTradingService } from "./services/gridTradingService"
import { OrdersTable } from "./components/orders-table"
import { BotStats } from "./components/bot-stats"

export default function Home() {
  const [isRunning, setIsRunning] = useState(false)
  const [config, setConfig] = useState<GridConfig | null>(null)
  const [gridService] = useState(() => GridTradingService.getInstance())
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadBotState = async () => {
      const status = await gridService.getStatus()
      setIsRunning(status.isRunning)
      setConfig(status.config)
    }
    loadBotState()
  }, [gridService])

  const handleConfigSubmit = async (config: GridConfig) => {
    setIsLoading(true)
    try {
      await gridService.startGrid(config)
      setIsRunning(true)
      setConfig(config)
    } catch (error) {
      console.error("Failed to start grid:", error)
      alert(error instanceof Error ? error.message : "Failed to start grid")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStopBot = async () => {
    setIsLoading(true)
    try {
      await gridService.stopGrid()
      setIsRunning(false)
      setConfig(null)
    } catch (error) {
      console.error("Failed to stop grid:", error)
      alert(error instanceof Error ? error.message : "Failed to stop grid")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              TLS Grid Trading Bot
            </h1>
            <p className="mt-2 text-gray-400">Automated trading with dynamic grid strategy</p>
          </div>
          {isRunning && (
            <Button 
              variant="destructive" 
              onClick={handleStopBot}
              disabled={isLoading}
              className="px-8 relative transition-all duration-200 hover:scale-105 active:scale-95 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              <span className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
                Stop Bot
              </span>
              {isLoading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                      fill="none"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </span>
              )}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <section className="rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-6 transition-all duration-300 hover:bg-gray-800/70">
              <h2 className="text-xl font-semibold mb-4 text-cyan-300">Market Overview</h2>
              <MarketOverview />
            </section>

            <section className="rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-6 transition-all duration-300 hover:bg-gray-800/70">
              <h2 className="text-xl font-semibold mb-4 text-cyan-300">Balance</h2>
              <BalanceDisplay />
            </section>
          </div>

          <section className="rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-6 transition-all duration-300 hover:bg-gray-800/70">
            <h2 className="text-xl font-semibold mb-4 text-cyan-300">Grid Configuration</h2>
            {!isRunning && <GridConfigForm onSubmit={handleConfigSubmit} isRunning={isRunning} />}
            {isRunning && config && (
              <div className="rounded-lg border border-gray-700 p-4 bg-gray-900/50">
                <h3 className="font-medium mb-4 text-gray-300">Current Configuration</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Trading Pair</span>
                    <span className="font-mono text-cyan-300">{config.symbol}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Grid Lines</span>
                    <span className="font-mono text-cyan-300">{config.gridLines}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Min Distance</span>
                    <span className="font-mono text-cyan-300">{config.minDistance}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Max Distance</span>
                    <span className="font-mono text-cyan-300">{config.maxDistance}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Investment</span>
                    <span className="font-mono text-cyan-300">{config.totalInvestment.toLocaleString()} USDT</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Investment Per Grid</span>
                    <span className="font-mono text-cyan-300">
                      {(config.totalInvestment / (config.gridLines - 1)).toLocaleString()} USDT
                    </span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="text-sm text-gray-400">
                      Grid will auto-adjust when:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Price changes by ≥ 2%</li>
                        <li>Every 30 minutes</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="mt-6 space-y-6">
          <section className="rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-6 transition-all duration-300 hover:bg-gray-800/70">
            <h2 className="text-xl font-semibold mb-4 text-cyan-300">Bot Statistics</h2>
            <BotStats symbol="TLS/USDT" />
          </section>

          <section className="rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-6 transition-all duration-300 hover:bg-gray-800/70">
            <h2 className="text-xl font-semibold mb-4 text-cyan-300">Active Orders</h2>
            <OrdersTable symbol="TLS/USDT" />
          </section>
        </div>
      </div>
    </div>
  )
}
