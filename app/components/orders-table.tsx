'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ReloadIcon,
  Cross1Icon
} from "@radix-ui/react-icons"
import { XeggexApi } from "../api/xeggexApi"
import { GridTradingService } from "../services/gridTradingService"
import { EXCHANGE_API_KEY, EXCHANGE_SECRET_KEY } from "@/constants"
import { useEffect, useState } from "react"

interface Order {
  id: string
  market: string
  side: 'buy' | 'sell'
  type: string
  price: string
  quantity: string
  executedQuantity: string
  remainQuantity: string
  remainTotal: string
  status: string
  isActive: boolean
  feeRate: string
  isBot: boolean
  createdAt: string
  updatedAt: string
}

export function OrdersTable({ symbol }: { symbol: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize] = useState(10)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [cancellingOrders, setCancellingOrders] = useState<{ [key: string]: boolean }>({})

  const api = new XeggexApi(EXCHANGE_API_KEY, EXCHANGE_SECRET_KEY)
  const gridService = GridTradingService.getInstance()

  const loadOrders = async (page: number) => {
    try {
      setLoading(true)
      setError(null)
      
      // Calculate offset
      const offset = (page - 1) * pageSize
      
      // Get orders for current page
      const ordersForPage = await api.getOpenOrders(symbol, pageSize, offset)
      
      // Filter and mark bot orders
      const ordersWithBotStatus = await Promise.all(
        ordersForPage.map(async (order: Order) => ({
          ...order,
          isBot: await gridService.isBotOrder(order.id)
        }))
      )

      // Get total count from API if available, otherwise estimate from current page
      const totalCount = ordersForPage.length === pageSize ? (page * pageSize) + 1 : page * pageSize
      const calculatedTotalPages = Math.max(1, Math.ceil(totalCount / pageSize))

      setOrders(ordersWithBotStatus)
      setTotalPages(calculatedTotalPages)
      setError(null)
    } catch (err) {
      console.error('Error loading orders:', err)
      setError('Failed to load orders. Click refresh to try again.')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadOrders(currentPage)
    const interval = setInterval(() => loadOrders(currentPage), 10000)
    return () => clearInterval(interval)
  }, [currentPage, symbol])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadOrders(currentPage)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString()
  }

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days} days ago`
    } else if (hours > 0) {
      return `${hours} hours ago`
    } else if (minutes > 0) {
      return `${minutes} minutes ago`
    } else {
      return `${seconds} seconds ago`
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    try {
      setCancellingOrders(prev => ({ ...prev, [orderId]: true }))
      const api = new XeggexApi(
        EXCHANGE_API_KEY,
        EXCHANGE_SECRET_KEY
      )
      await api.cancelOrder(orderId)
      await handleRefresh()
    } catch (error) {
      console.error('Failed to cancel order:', error)
    } finally {
      setCancellingOrders(prev => ({ ...prev, [orderId]: false }))
    }
  }

  if (loading && !isRefreshing) {
    return (
      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="p-0">
          <div className="p-8">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <div className="h-4 bg-gray-700/50 rounded w-1/6 animate-pulse" />
                  <div className="h-4 bg-gray-700/50 rounded w-1/6 animate-pulse" />
                  <div className="h-4 bg-gray-700/50 rounded w-1/6 animate-pulse" />
                  <div className="h-4 bg-gray-700/50 rounded w-1/6 animate-pulse" />
                  <div className="h-4 bg-gray-700/50 rounded w-1/6 animate-pulse" />
                  <div className="h-4 bg-gray-700/50 rounded w-1/6 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardContent className="p-0">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="text-sm text-gray-400">
            Showing {orders.length} orders
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-gray-800 hover:bg-gray-700 border-gray-600"
          >
            {isRefreshing ? (
              <ReloadIcon className="h-4 w-4 animate-spin text-cyan-300" />
            ) : (
              <ReloadIcon className="h-4 w-4 text-gray-400" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>

        {error ? (
          <div className="text-center py-4 text-red-400">{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-800/50">
                    <TableHead className="text-gray-400">Type</TableHead>
                    <TableHead className="text-gray-400">Price</TableHead>
                    <TableHead className="text-gray-400">Amount</TableHead>
                    <TableHead className="text-gray-400">Filled</TableHead>
                    <TableHead className="text-gray-400">Total</TableHead>
                    <TableHead className="text-gray-400">Created</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow 
                      key={order.id}
                      className="border-gray-700 hover:bg-gray-800/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.side === 'buy' 
                              ? 'bg-green-500/20 text-green-300' 
                              : 'bg-red-500/20 text-red-300'
                          }`}>
                            {order.side.toUpperCase()}
                          </span>
                          {order.isBot && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                              BOT
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-gray-300">
                        ${parseFloat(order.price).toFixed(8)}
                      </TableCell>
                      <TableCell className="font-mono text-gray-300">
                        {parseFloat(order.quantity).toFixed(8)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <span className="font-mono text-gray-300">
                            {parseFloat(order.executedQuantity).toFixed(8)}
                          </span>
                          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                order.side === 'buy' ? 'bg-green-500' : 'bg-red-500'
                              }`}
                              style={{ 
                                width: `${(parseFloat(order.executedQuantity) / parseFloat(order.quantity)) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-gray-300">
                        ${parseFloat(order.remainTotal).toFixed(8)}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        <div className="flex flex-col">
                          <span>{formatDate(order.createdAt)}</span>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(order.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancellingOrders[order.id]}
                          className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                        >
                          {cancellingOrders[order.id] ? (
                            <ReloadIcon className="h-4 w-4 animate-spin text-gray-400" />
                          ) : (
                            <Cross1Icon className="h-4 w-4" />
                          )}
                          <span className="sr-only">Cancel order</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between p-4 border-t border-gray-700">
              <div className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="bg-gray-800 hover:bg-gray-700 border-gray-600"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  <span className="sr-only">First page</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="bg-gray-800 hover:bg-gray-700 border-gray-600"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  <span className="sr-only">Previous page</span>
                </Button>
                <div className="flex items-center space-x-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1
                    const isCurrentPage = page === currentPage
                    const isNearCurrent = Math.abs(page - currentPage) <= 1
                    const isEndPage = page === 1 || page === totalPages

                    if (!isNearCurrent && !isEndPage) {
                      if (page === 2 || page === totalPages - 1) {
                        return <span key={page} className="text-gray-500">...</span>
                      }
                      return null
                    }

                    return (
                      <Button
                        key={page}
                        variant={isCurrentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={`w-8 ${
                          isCurrentPage 
                            ? 'bg-cyan-600 hover:bg-cyan-500 text-white' 
                            : 'bg-gray-800 hover:bg-gray-700 border-gray-600'
                        }`}
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="bg-gray-800 hover:bg-gray-700 border-gray-600"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                  <span className="sr-only">Next page</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="bg-gray-800 hover:bg-gray-700 border-gray-600"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                  <span className="sr-only">Last page</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
