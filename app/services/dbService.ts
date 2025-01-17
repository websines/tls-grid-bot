import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { DB_PATH, GridOrder, GridStats } from '@/constants'

class DBService {
  private static instance: DBService
  private db: any

  private constructor() {}

  static async getInstance() {
    if (!DBService.instance) {
      DBService.instance = new DBService()
      await DBService.instance.initialize()
    }
    return DBService.instance
  }

  private async initialize() {
    this.db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    })

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS grid_orders (
        id TEXT PRIMARY KEY,
        symbol TEXT,
        side TEXT,
        price TEXT,
        amount TEXT,
        filled TEXT,
        status TEXT,
        timestamp INTEGER,
        profit REAL
      );

      CREATE TABLE IF NOT EXISTS grid_stats (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        totalProfit REAL,
        totalTrades INTEGER,
        successfulTrades INTEGER,
        failedTrades INTEGER,
        lastUpdate INTEGER
      );
    `)

    // Initialize stats if not exists
    const stats = await this.db.get('SELECT * FROM grid_stats WHERE id = 1')
    if (!stats) {
      await this.db.run(`
        INSERT INTO grid_stats (id, totalProfit, totalTrades, successfulTrades, failedTrades, lastUpdate)
        VALUES (1, 0, 0, 0, 0, ?)
      `, Date.now())
    }
  }

  async addOrder(order: GridOrder) {
    await this.db.run(`
      INSERT INTO grid_orders (id, symbol, side, price, amount, filled, status, timestamp, profit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [order.id, order.symbol, order.side, order.price, order.amount, order.filled, order.status, order.timestamp, order.profit || 0])
  }

  async updateOrder(orderId: string, updates: Partial<GridOrder>) {
    const setClause = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ')
    const values = [...Object.values(updates), orderId]
    
    await this.db.run(`
      UPDATE grid_orders
      SET ${setClause}
      WHERE id = ?
    `, values)
  }

  async getOrders(symbol: string): Promise<GridOrder[]> {
    return this.db.all('SELECT * FROM grid_orders WHERE symbol = ? ORDER BY timestamp DESC', symbol)
  }

  async getStats(): Promise<GridStats> {
    return this.db.get('SELECT * FROM grid_stats WHERE id = 1')
  }

  async updateStats(updates: Partial<GridStats>) {
    const setClause = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ')
    const values = [...Object.values(updates)]
    
    await this.db.run(`
      UPDATE grid_stats
      SET ${setClause}
      WHERE id = 1
    `, values)
  }

  async getBotOrders(symbol: string): Promise<GridOrder[]> {
    return this.db.all('SELECT * FROM grid_orders WHERE symbol = ? AND status != "cancelled" ORDER BY price DESC', symbol)
  }

  async clearBotOrders(symbol: string) {
    await this.db.run('DELETE FROM grid_orders WHERE symbol = ?', symbol)
  }
}
