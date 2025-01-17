import { XeggexApi } from '../api/xeggexApi';
import { EXCHANGE_API_KEY, EXCHANGE_SECRET_KEY, GridConfig } from '@/constants';
import { getBaseUrl } from '../lib/utils';

export class GridTradingService {
  private api: XeggexApi;
  private static instance: GridTradingService;
  private isRunning = false;
  private config: GridConfig | null = null;
  private baseUrl: string;
  private lastGridUpdate: number = 0;
  private lastPrice: number = 0;
  private readonly GRID_UPDATE_INTERVAL = 15 * 60 * 1000; // 2 minutes in milliseconds
  private readonly PRICE_CHANGE_THRESHOLD = 2; // 2% price change threshold
  private profitStats = {
    totalProfit: 0,
    trades: 0,
    profitableTrades: 0,
    lastOptimization: 0
  };
  private orderMonitoringInterval: NodeJS.Timeout | null = null;
  private gridUpdateInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.api = new XeggexApi(EXCHANGE_API_KEY, EXCHANGE_SECRET_KEY);
    this.baseUrl = getBaseUrl();
    this.loadState();
  }

  private async loadState() {
    try {
      const response = await fetch(`${this.baseUrl}/api/bot/state`);
      const data = await response.json();
      if (data.status === 'success') {
        this.isRunning = data.data.isRunning;
        this.config = data.data.config;
      }
    } catch (error) {
      console.error('Error loading bot state:', error);
    }
  }

  static getInstance() {
    if (!GridTradingService.instance) {
      GridTradingService.instance = new GridTradingService();
    }
    return GridTradingService.instance;
  }

  private async saveState() {
    try {
      await fetch(`${this.baseUrl}/api/bot/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isRunning: this.isRunning,
          config: this.config
        })
      });
    } catch (error) {
      console.error('Error saving bot state:', error);
    }
  }

  private async addBotOrder(orderId: string, symbol: string) {
    try {
      await fetch(`${this.baseUrl}/api/bot/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, symbol })
      });
    } catch (error) {
      console.error('Error adding bot order:', error);
    }
  }

  private async removeBotOrder(orderId: string, symbol: string) {
    try {
      await fetch(`${this.baseUrl}/api/bot/orders`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, symbol })
      });
    } catch (error) {
      console.error('Error removing bot order:', error);
    }
  }

  private async getBotOrders(symbol: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bot/orders?symbol=${encodeURIComponent(symbol)}`);
      const data = await response.json();
      return data.status === 'success' ? data.data : [];
    } catch (error) {
      console.error('Error getting bot orders:', error);
      return [];
    }
  }

  private async calculateDynamicGridSpacing(symbol: string): Promise<number> {
    try {
      const ticker = await this.api.getTicker(symbol);
      if (!ticker || !ticker.high || !ticker.low) {
        console.log('No ticker data available, using default spacing');
        return this.config?.maxDistance || 5;
      }

      // Calculate 24h price range volatility
      const highPrice = parseFloat(ticker.high);
      const lowPrice = parseFloat(ticker.low);
      const priceRange = ((highPrice - lowPrice) / lowPrice) * 100;
      
      console.log('Price range calculation:', {
        highPrice: highPrice.toFixed(8),
        lowPrice: lowPrice.toFixed(8),
        range: priceRange.toFixed(2) + '%'
      });
      
      // Calculate dynamic spacing
      const minSpacing = 1;
      const maxSpacing = 10;
      const volatilityFactor = 0.5;
      const dynamicSpacing = Math.min(Math.max(priceRange * volatilityFactor, minSpacing), maxSpacing);
      
      console.log(`Dynamic grid spacing: ${dynamicSpacing.toFixed(2)}% (based on 24h range: ${priceRange.toFixed(2)}%)`);
      return dynamicSpacing;
    } catch (error) {
      console.error('Error calculating dynamic grid spacing:', error);
      return this.config?.maxDistance || 5;
    }
  }

  async startGrid(config: GridConfig) {
    if (this.isRunning) {
      throw new Error('Grid is already running');
    }

    try {
      console.log('Starting grid with config:', {
        ...config,
        totalInvestment: '***'
      });
      
      // Get current market price and calculate dynamic spacing
      const ticker = await this.api.getTicker(config.symbol);
      const currentPrice = parseFloat(ticker.last_price);
      const dynamicMaxDistance = await this.calculateDynamicGridSpacing(config.symbol);
      
      // Update config with dynamic spacing
      config = {
        ...config,
        maxDistance: dynamicMaxDistance
      };
      
      // Update last price and grid update time
      this.lastPrice = currentPrice;
      this.lastGridUpdate = Date.now();
      
      // Calculate grid points (2x config.gridLines for both buy and sell)
      const totalGridPoints = config.gridLines * 2;
      const buyGridPoints = totalGridPoints / 2;
      const sellGridPoints = totalGridPoints / 2;
      
      // Calculate price ranges
      const upperPrice = currentPrice * (1 + config.maxDistance/100);
      const lowerPrice = currentPrice * (1 - config.maxDistance/100);
      
      // Calculate price steps
      const buyPriceStep = (currentPrice - lowerPrice) / buyGridPoints;
      const sellPriceStep = (upperPrice - currentPrice) / sellGridPoints;
      
      // Generate grid prices
      const buyPrices = Array.from({ length: buyGridPoints }, (_, i) => 
        Number((lowerPrice + (i * buyPriceStep)).toFixed(8))
      );
      
      const sellPrices = Array.from({ length: sellGridPoints }, (_, i) => 
        Number((currentPrice + ((i + 1) * sellPriceStep)).toFixed(8))
      );
      
      console.log('Grid setup:', {
        buyOrders: buyGridPoints,
        sellOrders: sellGridPoints,
        buyPrices,
        sellPrices
      });

      // Calculate investment distribution
      const buyOrderSize = config.totalInvestment / totalGridPoints;
      const sellOrderSize = buyOrderSize; // Equal distribution

      // Check balance
      const balances = await this.api.getBalances();
      const usdtBalance = balances.find((b: any) => b.asset === 'USDT');
      if (!usdtBalance || parseFloat(usdtBalance.available) < config.totalInvestment) {
        throw new Error('Insufficient USDT balance');
      }

      // Place buy orders
      console.log('Placing buy orders...');
      for (const price of buyPrices) {
        try {
          const quantity = Number((buyOrderSize / price).toFixed(8));
          console.log(`Placing buy order: ${quantity} @ ${price}`);
          
          const buyOrder = await this.api.createLimitOrder(
            config.symbol,
            'buy',
            quantity,
            price
          );
          await this.addBotOrder(buyOrder.id, config.symbol);
        } catch (error) {
          console.error('Error placing buy order:', error);
          await this.stopGrid();
          throw new Error('Failed to place grid orders');
        }
      }

      // Place sell orders
      console.log('Placing sell orders...');
      for (const price of sellPrices) {
        try {
          const quantity = Number((sellOrderSize / price).toFixed(8));
          console.log(`Placing sell order: ${quantity} @ ${price}`);
          
          const sellOrder = await this.api.createLimitOrder(
            config.symbol,
            'sell',
            quantity,
            price
          );
          await this.addBotOrder(sellOrder.id, config.symbol);
        } catch (error) {
          console.error('Error placing sell order:', error);
          await this.stopGrid();
          throw new Error('Failed to place grid orders');
        }
      }

      this.isRunning = true;
      this.config = config;
      await this.saveState();

      // Start order monitoring
      this.startOrderMonitoring();

    } catch (error) {
      console.error('Error starting grid:', error);
      throw error;
    }
  }

  private async replaceFilledOrder(filledOrder: any) {
    const price = parseFloat(filledOrder.price);
    const side = filledOrder.side;
    
    try {
      // Get current market price
      const ticker = await this.api.getTicker(this.config!.symbol);
      const currentPrice = parseFloat(ticker.last_price);
      
      // Calculate grid step
      const gridStep = this.config!.maxDistance / (this.config!.gridLines - 1);
      
      // Calculate new order price
      const newPrice = side === 'buy'
        ? price * (1 + gridStep/100)  // Place sell higher
        : price * (1 - gridStep/100); // Place buy lower
      
      // Calculate order size
      const orderSize = this.config!.totalInvestment / (this.config!.gridLines * 2);
      const quantity = Number((orderSize / newPrice).toFixed(8));
      
      console.log(`Replacing ${side} order with ${side === 'buy' ? 'sell' : 'buy'} order:`, {
        price: newPrice,
        quantity
      });

      const newOrder = await this.api.createLimitOrder(
        this.config!.symbol,
        side === 'buy' ? 'sell' : 'buy',
        quantity,
        newPrice
      );

      await this.addBotOrder(newOrder.id, this.config!.symbol);
    } catch (error) {
      console.error('Error replacing order:', error);
    }
  }

  private async checkAndUpdateGrid() {
    if (!this.isRunning || !this.config) return;

    try {
      const now = Date.now();
      const ticker = await this.api.getTicker(this.config.symbol);
      const currentPrice = parseFloat(ticker.last_price);

      // Calculate price change percentage
      const priceChangePercent = this.lastPrice > 0 
        ? Math.abs((currentPrice - this.lastPrice) / this.lastPrice * 100)
        : 0;

      const timeElapsed = now - this.lastGridUpdate;
      const shouldUpdateTime = timeElapsed >= this.GRID_UPDATE_INTERVAL;
      const shouldUpdatePrice = priceChangePercent >= this.PRICE_CHANGE_THRESHOLD;

      console.log('Grid update check:', {
        currentTime: new Date(now).toISOString(),
        lastUpdate: new Date(this.lastGridUpdate).toISOString(),
        timeElapsed: `${(timeElapsed / 1000 / 60).toFixed(2)} minutes`,
        currentPrice: currentPrice,
        lastPrice: this.lastPrice,
        priceChange: `${priceChangePercent.toFixed(2)}%`,
        shouldUpdateTime,
        shouldUpdatePrice
      });

      if (shouldUpdateTime || shouldUpdatePrice) {
        console.log(`Recreating grid due to: ${shouldUpdateTime ? 'time interval' : 'price change'}`);
        console.log(`Time elapsed: ${timeElapsed / 1000 / 60} minutes`);
        console.log(`Price change: ${priceChangePercent.toFixed(2)}%`);

        // Store current config and state
        const currentConfig = { ...this.config };
        const wasRunning = this.isRunning;
        console.log('Current config before recreation:', currentConfig);

        try {
          // First verify we can get the current orders
          const openOrders = await this.api.getOpenOrders(this.config.symbol);
          console.log(`Found ${openOrders.length} open orders before grid recreation`);

          // Temporarily mark as not running to prevent other updates
          this.isRunning = false;

          // Cancel orders one by one, ignoring errors
          const botOrders = await this.getBotOrders(this.config.symbol);
          for (const orderId of botOrders) {
            try {
              await this.api.cancelOrder(orderId);
              console.log(`Successfully cancelled order ${orderId}`);
            } catch (error) {
              console.log(`Could not cancel order ${orderId}, might be already cancelled:`, error);
            }
            // Always remove from tracking
            await this.removeBotOrder(orderId, this.config.symbol);
          }

          // Start new grid with same config
          await this.startGrid(currentConfig);
          console.log('Grid recreated successfully');

          // Update timestamps and price
          this.lastGridUpdate = now;
          this.lastPrice = currentPrice;
        } catch (error) {
          console.error('Error during grid recreation:', error);
          // Restore running state if there was an error
          this.isRunning = wasRunning;
          // Try to restore the grid to its previous state
          if (wasRunning) {
            try {
              await this.startGrid(currentConfig);
              console.log('Restored grid to previous state after error');
            } catch (restoreError) {
              console.error('Failed to restore grid:', restoreError);
              this.isRunning = false;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in checkAndUpdateGrid:', error);
    }
  }

  private async startOrderMonitoring() {
    // Clear any existing intervals
    if (this.orderMonitoringInterval) {
      clearInterval(this.orderMonitoringInterval);
    }
    if (this.gridUpdateInterval) {
      clearInterval(this.gridUpdateInterval);
    }

    // Start order monitoring
    this.orderMonitoringInterval = setInterval(async () => {
      if (!this.isRunning || !this.config) return;

      try {
        const openOrders = await this.api.getOpenOrders(this.config.symbol);
        const botOrders = await this.getBotOrders(this.config.symbol);
        
        // Find filled orders
        const filledOrders = botOrders.filter(
          orderId => !openOrders.find((o: any) => o.id === orderId)
        );

        console.log(`Checking orders - Open: ${openOrders.length}, Bot: ${botOrders.length}, Filled: ${filledOrders.length}`);

        // Handle filled orders
        for (const orderId of filledOrders) {
          try {
            // Get order details from exchange
            const orderDetails = await this.api.getOpenOrders(this.config.symbol, 500, 0);
            console.log('Order details for filled order:', orderDetails);
            
            if (orderDetails && orderDetails.status === 'filled') {
              console.log(`Processing filled order ${orderId}`);
              
              // Update stats with the filled order
              await this.updateStats(this.config.symbol, orderDetails);
              
              // Remove the filled order from tracking
              await this.removeBotOrder(orderId, this.config.symbol);

              // Replace the filled order with a new one
              await this.replaceFilledOrder(orderDetails);
            }
          } catch (error) {
            console.error(`Error handling filled order ${orderId}:`, error);
          }
        }
      } catch (error) {
        console.error('Error monitoring orders:', error);
      }
    }, 10000);

    // Add grid update check
    this.gridUpdateInterval = setInterval(async () => {
      try {
        await this.checkAndUpdateGrid();
      } catch (error) {
        console.error('Error checking grid update:', error);
      }
    }, 60000); // Check every minute
  }

  async getStats(symbol: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/bot/stats?symbol=${encodeURIComponent(symbol)}`);
      const data = await response.json();
      return data.status === 'success' ? data.data : null;
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  }

  async stopGrid() {
    if (!this.isRunning) {
      throw new Error('Grid is not running');
    }

    try {
      // Clear monitoring intervals
      if (this.orderMonitoringInterval) {
        clearInterval(this.orderMonitoringInterval);
        this.orderMonitoringInterval = null;
      }
      if (this.gridUpdateInterval) {
        clearInterval(this.gridUpdateInterval);
        this.gridUpdateInterval = null;
      }

      // Clear all bot orders
      const symbol = this.config?.symbol || 'TLS/USDT';
      const botOrders = await this.getBotOrders(symbol);
      
      // Cancel all bot orders
      for (const orderId of botOrders) {
        try {
          await this.api.cancelOrder(orderId);
        } catch (error) {
          // Ignore cancellation errors as the order might already be filled/cancelled
          console.log(`Order ${orderId} might already be cancelled or filled:`, error);
        }
        // Always remove from our tracking regardless of cancel success
        await this.removeBotOrder(orderId, symbol);
      }

      // Reset stats
      await fetch(`${this.baseUrl}/api/bot/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          stats: {
            totalProfit: 0,
            totalTrades: 0,
            profitableTrades: 0,
            highestPrice: 0,
            lowestPrice: 0,
            volume24h: 0,
            updatedAt: Date.now()
          }
        })
      });

      this.isRunning = false;
      this.config = null;
      this.profitStats = {
        totalProfit: 0,
        trades: 0,
        profitableTrades: 0,
        lastOptimization: 0
      };
      await this.saveState();
    } catch (error) {
      console.error('Error stopping grid:', error);
      throw error;
    }
  }

  async getStatus() {
    const symbol = this.config?.symbol || 'TLS/USDT';
    const botOrders = await this.getBotOrders(symbol);

    return {
      isRunning: this.isRunning,
      config: this.config,
      botOrderCount: botOrders.length
    };
  }

  async isBotOrder(orderId: string): Promise<boolean> {
    const symbol = this.config?.symbol || 'TLS/USDT';
    const botOrders = await this.getBotOrders(symbol);
    return botOrders.includes(orderId);
  }

  private async updateStats(symbol: string, trade: any) {
    try {
      // Get current stats
      const response = await fetch(`${this.baseUrl}/api/bot/stats?symbol=${encodeURIComponent(symbol)}`);
      const data = await response.json();
      const currentStats = data.status === 'success' ? data.data : {
        totalProfit: 0,
        totalTrades: 0,
        profitableTrades: 0,
        highestPrice: 0,
        lowestPrice: parseFloat(trade.price),
        volume24h: 0,
        updatedAt: Date.now()
      };
      
      // Calculate profit for this trade
      const price = parseFloat(trade.price);
      const quantity = parseFloat(trade.quantity);
      const tradeVolume = price * quantity;
      
      // For buy orders, we spend money (negative profit)
      // For sell orders, we receive money (positive profit)
      const tradeProfit = trade.side === 'sell' ? tradeVolume : -tradeVolume;
      
      console.log('Updating stats with trade:', {
        price,
        quantity,
        volume: tradeVolume,
        profit: tradeProfit,
        side: trade.side
      });
      
      // Update stats
      const updatedStats = {
        totalProfit: (currentStats.totalProfit || 0) + tradeProfit,
        totalTrades: (currentStats.totalTrades || 0) + 1,
        profitableTrades: (currentStats.profitableTrades || 0) + (tradeProfit > 0 ? 1 : 0),
        lastTradeTime: Date.now(),
        lastTradePrice: price,
        lastTradeType: trade.side,
        highestPrice: Math.max(currentStats.highestPrice || 0, price),
        lowestPrice: currentStats.lowestPrice ? Math.min(currentStats.lowestPrice, price) : price,
        volume24h: (currentStats.volume24h || 0) + tradeVolume,
        updatedAt: Date.now()
      };

      console.log('Updated stats:', updatedStats);

      // Save updated stats
      await fetch(`${this.baseUrl}/api/bot/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          stats: updatedStats
        })
      });

      // Update local stats for optimization
      this.profitStats = {
        totalProfit: updatedStats.totalProfit,
        trades: updatedStats.totalTrades,
        profitableTrades: updatedStats.profitableTrades,
        lastOptimization: this.profitStats.lastOptimization
      };

    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  private async optimizeGridParameters() {
    if (!this.config || !this.isRunning) return;

    const now = Date.now();
    const OPTIMIZATION_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours
    
    if (now - this.profitStats.lastOptimization < OPTIMIZATION_INTERVAL) return;

    // Calculate success rate
    const successRate = this.profitStats.trades > 0 
      ? (this.profitStats.profitableTrades / this.profitStats.trades) * 100 
      : 0;

    // Adjust grid lines based on success rate
    let newGridLines = this.config.gridLines;
    if (successRate > 70) {
      // If very successful, increase grid lines to capture more opportunities
      newGridLines = Math.min(newGridLines + 2, 20); // Max 20 grid lines
    } else if (successRate < 30) {
      // If not successful, reduce grid lines to minimize risk
      newGridLines = Math.max(newGridLines - 2, 4); // Min 4 grid lines
    }

    // Only update if grid lines changed
    if (newGridLines !== this.config.gridLines) {
      console.log(`Optimizing grid: Adjusting grid lines from ${this.config.gridLines} to ${newGridLines} (Success rate: ${successRate.toFixed(2)}%)`);
      
      const currentConfig = { ...this.config, gridLines: newGridLines };
      await this.stopGrid();
      await this.startGrid(currentConfig);
    }

    this.profitStats.lastOptimization = now;
  }
}
