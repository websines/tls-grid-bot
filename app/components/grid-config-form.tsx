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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!currentPrice) {
      setError("Unable to fetch current price")
      return
    }

    // Validate inputs
    const minDist = parseFloat(config.minDistance)
    const maxDist = parseFloat(config.maxDistance)
    const lines = parseInt(config.gridLines)
    const investment = parseFloat(config.totalInvestment)

    if (isNaN(minDist) || isNaN(maxDist) || isNaN(lines) || isNaN(investment)) {
      setError("All fields must be valid numbers")
      return
    }

    if (minDist >= maxDist) {
      setError("Maximum distance must be greater than minimum distance")
      return
    }

    if (minDist < 0.1) {
      setError("Minimum distance must be at least 0.1%")
      return
    }

    if (maxDist > 100) {
      setError("Maximum distance cannot exceed 100%")
      return
    }

    if (lines < 2) {
      setError("Must have at least 2 grid lines")
      return
    }

    if (investment <= 0) {
      setError("Investment must be greater than 0")
      return
    }

    // Calculate actual prices based on percentages
    const lowerPrice = currentPrice * (1 - maxDist/100)
    const upperPrice = currentPrice * (1 + maxDist/100)

    onSubmit({
      symbol: config.symbol,
      upperPrice,
      lowerPrice,
      gridLines: lines,
      totalInvestment: investment,
      minDistance: minDist,
      maxDistance: maxDist
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grid Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minDistance">Minimum Grid Distance (%)</Label>
              <Input
                id="minDistance"
                placeholder="e.g. 1"
                value={config.minDistance}
                onChange={(e) => setConfig({ ...config, minDistance: e.target.value })}
                disabled={isRunning}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxDistance">Maximum Grid Distance (%)</Label>
              <Input
                id="maxDistance"
                placeholder="e.g. 10"
                value={config.maxDistance}
                onChange={(e) => setConfig({ ...config, maxDistance: e.target.value })}
                disabled={isRunning}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gridLines">Number of Grid Lines</Label>
              <Input
                id="gridLines"
                placeholder="e.g. 5"
                value={config.gridLines}
                onChange={(e) => setConfig({ ...config, gridLines: e.target.value })}
                disabled={isRunning}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="investment">Total Investment (USDT)</Label>
              <Input
                id="investment"
                placeholder="e.g. 100"
                value={config.totalInvestment}
                onChange={(e) => setConfig({ ...config, totalInvestment: e.target.value })}
                disabled={isRunning}
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {currentPrice && config.minDistance && config.maxDistance && config.gridLines && (
            <div className="text-sm text-muted-foreground">
              Grid Metrics:
              <ul className="list-disc list-inside mt-2">
                <li>
                  Current Price: {currentPrice.toFixed(8)} USDT
                </li>
                <li>
                  Price Range: {currentPrice * (1 - parseFloat(config.maxDistance)/100).toFixed(8)} - {currentPrice * (1 + parseFloat(config.maxDistance)/100).toFixed(8)} USDT
                </li>
                <li>
                  Grid Distance: {parseFloat(config.minDistance)}% - {parseFloat(config.maxDistance)}%
                </li>
                {config.totalInvestment && (
                  <li>
                    Investment per Grid: {(parseFloat(config.totalInvestment) / (parseInt(config.gridLines) - 1)).toFixed(2)} USDT
                  </li>
                )}
              </ul>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isRunning}>
            {isRunning ? "Bot is Running" : "Apply Configuration"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
