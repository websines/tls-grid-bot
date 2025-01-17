import { XeggexApi } from '../api/xeggexApi';

export interface GridConfig {
  symbol: string;
  upperPrice: number;
  lowerPrice: number;
  gridLines: number;
  totalInvestment: number;
}

export class GridTradingService {
  private api: XeggexApi;
  private config: GridConfig | null = null;
  private isRunning = false;

  constructor() {
    this.api = new XeggexApi(
      'b91a1f95097724649361726a77dcc232',
      '8400d116bffae7ab3895f46c16109c84e9fc4ac19b5dc454'
    );
  }

  async startGrid(config: GridConfig) {
    if (this.isRunning) {
      throw new Error('Grid is already running');
    }

    try {
      console.log('Starting grid with config:', {
        ...config,
        totalInvestment: '***' // Hide investment amount
      });
      
      // Validate config
      if (config.upperPrice <= config.lowerPrice) {
        throw new Error('Upper price must be greater than lower price');
      }
      if (config.gridLines < 2) {
        throw new Error('Must have at least 2 grid lines');
      }
      if (config.totalInvestment <= 0) {
        throw new Error('Total investment must be greater than 0');
      }

      // Get current market price to validate grid range
      const ticker = await this.api.getTicker(config.symbol);
      const currentPrice = parseFloat(ticker.last_price);
      console.log('Current market price:', currentPrice);
      
      if (currentPrice < config.lowerPrice || currentPrice > config.upperPrice) {
        throw new Error('Current price is outside the grid range');
      }

      // Calculate grid prices
      const priceStep = (config.upperPrice - config.lowerPrice) / (config.gridLines - 1);
      const gridPrices = Array.from({ length: config.gridLines }, (_, i) => 
        Number((config.lowerPrice + (i * priceStep)).toFixed(8))
      );
      console.log('Grid prices:', gridPrices);

      // Calculate order size (in USDT)
      const orderSize = config.totalInvestment / (config.gridLines - 1); // Divide by number of intervals

      // Check balance (without logging)
      const balances = await this.api.getBalances();
      const usdtBalance = balances.find((b: any) => b.asset === 'USDT');
      if (!usdtBalance || parseFloat(usdtBalance.free) < config.totalInvestment) {
        throw new Error('Insufficient USDT balance');
      }

      // Place orders
      console.log('Placing grid orders...');
      for (let i = 0; i < gridPrices.length - 1; i++) {
        const buyPrice = gridPrices[i];
        const sellPrice = gridPrices[i + 1];
        
        // Calculate token amounts with 8 decimal precision
        const buyQuantity = Number((orderSize / buyPrice).toFixed(8));
        const sellQuantity = Number((orderSize / sellPrice).toFixed(8));

        try {
          console.log(`Placing buy order at ${buyPrice}`);
          await this.api.createLimitOrder(
            config.symbol,
            'buy',
            buyQuantity,
            buyPrice
          );

          console.log(`Placing sell order at ${sellPrice}`);
          await this.api.createLimitOrder(
            config.symbol,
            'sell',
            sellQuantity,
            sellPrice
          );
        } catch (error) {
          console.error('Error placing orders:', error);
          // Try to cancel any placed orders before throwing
          try {
            const orders = await this.api.getOpenOrders(config.symbol);
            for (const order of orders) {
              await this.api.cancelOrder(order.id);
            }
          } catch (cancelError) {
            console.error('Error cancelling orders:', cancelError);
          }
          throw new Error('Failed to place grid orders. Any placed orders have been cancelled.');
        }
      }

      this.config = config;
      this.isRunning = true;
      return { success: true };
    } catch (error) {
      console.error('Error in startGrid:', error);
      this.isRunning = false;
      throw error;
    }
  }

  async stopGrid() {
    if (!this.isRunning) {
      throw new Error('Grid is not running');
    }

    try {
      console.log('Stopping grid...');
      const orders = await this.api.getOpenOrders(this.config?.symbol);
      
      for (const order of orders) {
        console.log(`Cancelling order ${order.id}`);
        await this.api.cancelOrder(order.id);
      }

      this.isRunning = false;
      this.config = null;
      return { success: true };
    } catch (error) {
      console.error('Error in stopGrid:', error);
      throw error;
    }
  }

  async getStatus() {
    try {
      if (!this.config) {
        return {
          isRunning: false,
          config: null,
          orders: [],
          balances: null,
          marketPrice: null
        };
      }

      const [orders, ticker, balances] = await Promise.all([
        this.api.getOpenOrders(this.config.symbol),
        this.api.getTicker(this.config.symbol),
        this.api.getBalances()
      ]);

      return {
        isRunning: this.isRunning,
        config: this.config,
        orders,
        marketPrice: ticker,
        balances: {
          tls: balances.find((b: any) => b.asset === 'TLS'),
          usdt: balances.find((b: any) => b.asset === 'USDT')
        }
      };
    } catch (error) {
      console.error('Error in getStatus:', error);
      throw error;
    }
  }
}
