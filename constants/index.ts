export const EXCHANGE_API_KEY = 'b91a1f95097724649361726a77dcc232'
export const EXCHANGE_SECRET_KEY = '8400d116bffae7ab3895f46c16109c84e9fc4ac19b5dc454'

export const DB_PATH = 'grid-bot.db'

export interface GridConfig {
  symbol: string
  minDistance: number
  maxDistance: number
  gridLines: number
  totalInvestment: number
}

export interface BotState {
  id: number
  isRunning: boolean
  config: GridConfig | null
  lastUpdate: number
}

export interface GridOrder {
  id: string
  symbol: string
  side: 'buy' | 'sell'
  price: string
  amount: string
  filled: string
  status: string
  timestamp: number
  profit?: number
  isBotOrder: boolean
}

export interface GridStats {
  totalProfit: number
  totalTrades: number
  successfulTrades: number
  failedTrades: number
  lastUpdate: number
}