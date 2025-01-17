import { XeggexApi } from './xeggexApi';
import { GridTradingBot } from './gridTradingBot';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.EXCHANGE_API_KEY || '';
const apiSecret = process.env.EXCHANGE_SECRET_KEY || '';

const api = new XeggexApi(apiKey, apiSecret);

// Example grid configuration
const gridConfig = {
  symbol: 'TLS/USDT',    // Trading pair
  upperPrice: 0.015,     // Upper price limit
  lowerPrice: 0.005,     // Lower price limit
  gridLines: 10,         // Number of grid lines
  totalInvestment: 100   // Total investment in USDT
};

const bot = new GridTradingBot(api, gridConfig);

async function startGridTrading() {
  try {
    // Initialize the grid
    console.log('Initializing grid...');
    await bot.initializeGrid();
    
    // Start monitoring loop
    console.log('Starting grid monitoring...');
    setInterval(async () => {
      try {
        await bot.monitorAndAdjust();
        const status = await bot.getGridStatus();
        console.log('Current grid status:', status);
      } catch (error) {
        console.error('Error in monitoring loop:', error);
      }
    }, 30000); // Check every 30 seconds
  } catch (error) {
    console.error('Error starting grid trading:', error);
  }
}

// Start the grid trading bot
startGridTrading();
