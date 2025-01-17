'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useEffect, useState } from "react"
import { GridOrder } from "@/constants"

interface OrdersTableProps {
  symbol: string
}

export function OrdersTable({ symbol }: OrdersTableProps) {
  const [orders, setOrders] = useState<GridOrder[]>([])

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`/api/orders?symbol=${symbol}`)
        const data = await response.json()
        if (data.status === 'success') {
          setOrders(data.data)
        }
      } catch (error) {
        console.error('Error fetching orders:', error)
      }
    }

    fetchOrders()
    const interval = setInterval(fetchOrders, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [symbol])

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Side</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Filled</TableHead>
            <TableHead className="text-right">Status</TableHead>
            <TableHead className="text-right">Profit/Loss</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className={order.side === 'buy' ? 'text-green-500' : 'text-red-500'}>
                {order.side.toUpperCase()}
              </TableCell>
              <TableCell className="text-right">{parseFloat(order.price).toFixed(8)}</TableCell>
              <TableCell className="text-right">{parseFloat(order.amount).toFixed(8)}</TableCell>
              <TableCell className="text-right">{parseFloat(order.filled).toFixed(8)}</TableCell>
              <TableCell className="text-right">{order.status}</TableCell>
              <TableCell className="text-right">
                {order.profit ? (
                  <span className={order.profit >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {order.profit.toFixed(2)} USDT
                  </span>
                ) : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
