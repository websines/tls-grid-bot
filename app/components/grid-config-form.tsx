'use client'
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { XeggexApi } from "../api/xeggexApi"
import { EXCHANGE_API_KEY, EXCHANGE_SECRET_KEY } from "@/constants"

interface GridConfigFormProps {
  onSubmit: (config: any) => void
  isRunning: boolean
}

export function GridConfigForm({ onSubmit, isRunning }: GridConfigFormProps) {
  const [config, setConfig] = useState({
    symbol: "TLS/USDT",
    minDistance: "",
    maxDistance: "",
    gridLines: "",
    totalInvestment: "",
  })

  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const api = new XeggexApi(EXCHANGE_API_KEY, EXCHANGE_SECRET_KEY)
        const ticker = await api.getTicker("TLS/USDT")
        setCurrentPrice(parseFloat(ticker.last_price))
      } catch (error) {
        console.error('Error fetching price:', error)
      }
    }

    fetchPrice()
    const interval = setInterval(fetchPrice, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (!currentPrice) {
        throw new Error("Unable to fetch current price")
      }

      // Validate inputs
      const minDist = parseFloat(config.minDistance)
      const maxDist = parseFloat(config.maxDistance)
      const lines = parseInt(config.gridLines)
      const investment = parseFloat(config.totalInvestment)

      if (isNaN(minDist) || isNaN(maxDist) || isNaN(lines) || isNaN(investment)) {
        throw new Error("All fields must be valid numbers")
      }

      if (minDist >= maxDist) {
        throw new Error("Maximum distance must be greater than minimum distance")
      }

      if (minDist < 0.1) {
        throw new Error("Minimum distance must be at least 0.1%")
      }

      if (maxDist > 100) {
        throw new Error("Maximum distance cannot exceed 100%")
      }

      if (lines < 2) {
        throw new Error("Must have at least 2 grid lines")
      }

      if (investment <= 0) {
        throw new Error("Investment must be greater than 0")
      }

      // Calculate actual prices based on percentages
      const lowerPrice = currentPrice * (1 - maxDist/100)
      const upperPrice = currentPrice * (1 + maxDist/100)

      await onSubmit({
        symbol: config.symbol,
        upperPrice,
        lowerPrice,
        gridLines: lines,
        totalInvestment: investment,
        minDistance: minDist,
        maxDistance: maxDist
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-100">Grid Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {currentPrice && (
            <div className="rounded-lg bg-gray-800/50 p-4 border border-gray-700">
              <div className="text-sm text-gray-400">Current Price</div>
              <div className="text-2xl font-bold font-mono text-gray-100">
                ${currentPrice.toFixed(8)}
              </div>
            </div>
          )}

          <div className="grid gap-6">
            <div className="space-y-2">
              <Label htmlFor="minDistance" className="text-sm font-medium text-gray-400">
                Minimum Distance (%)
                <span className="ml-2 text-xs text-gray-500">Min: 0.1%</span>
              </Label>
              <Input
                id="minDistance"
                type="number"
                step="0.1"
                min="0.1"
                value={config.minDistance}
                onChange={(e) => setConfig({ ...config, minDistance: e.target.value })}
                className="bg-gray-800/50 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500"
                placeholder="Enter minimum distance"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxDistance" className="text-sm font-medium text-gray-400">
                Maximum Distance (%)
                <span className="ml-2 text-xs text-gray-500">Max: 100%</span>
              </Label>
              <Input
                id="maxDistance"
                type="number"
                step="0.1"
                max="100"
                value={config.maxDistance}
                onChange={(e) => setConfig({ ...config, maxDistance: e.target.value })}
                className="bg-gray-800/50 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500"
                placeholder="Enter maximum distance"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gridLines" className="text-sm font-medium text-gray-400">
                Grid Lines
                <span className="ml-2 text-xs text-gray-500">Min: 2 lines</span>
              </Label>
              <Input
                id="gridLines"
                type="number"
                min="2"
                value={config.gridLines}
                onChange={(e) => setConfig({ ...config, gridLines: e.target.value })}
                className="bg-gray-800/50 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500"
                placeholder="Enter number of grid lines"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalInvestment" className="text-sm font-medium text-gray-400">
                Total Investment (USDT)
                <span className="ml-2 text-xs text-gray-500">Min: 0.1 USDT</span>
              </Label>
              <Input
                id="totalInvestment"
                type="number"
                step="0.1"
                min="0.1"
                value={config.totalInvestment}
                onChange={(e) => setConfig({ ...config, totalInvestment: e.target.value })}
                className="bg-gray-800/50 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500"
                placeholder="Enter total investment amount"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="bg-red-900/50 border-red-700 text-red-300">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || isRunning}
            className={`w-full ${
              isRunning 
                ? 'bg-red-600 hover:bg-red-500' 
                : 'bg-cyan-600 hover:bg-cyan-500'
            } text-white font-medium py-2 px-4 rounded-lg transition-colors`}
          >
            {isRunning ? (
              <>
                <span className="mr-2">Stop Grid Bot</span>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </>
            ) : (
              <>
                <span className="mr-2">Start Grid Bot</span>
                {isSubmitting && (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
