
interface XeggexApiOptions {
  prefixUrl: string;
  headers?: {
    Authorization: string;
  };
}

interface Market {
  id: string;
  symbol: string;
  base: string;
  quote: string;
  baseId: string;
  quoteId: string;
  active: boolean;
  minPrice: string;
  maxPrice: string;
  minAmount: string;
  maxAmount: string;
  pricePrecision: number;
  amountPrecision: number;
}

interface Order {
  id: string;
  symbol: string;
  type: string;
  side: 'buy' | 'sell';
  price: string;
  amount: string;
  filled: string;
  remaining: string;
  status: string;
  timestamp: number;
}

interface Balance {
  asset: string;
  free: string;
  locked: string;
  total: string;
}

export class XeggexApi {
  private apiURL: string;
  private auth?: string;
  private options: any;

  constructor(apiKey: string | null = null, apiSecret: string | null = null, apiURL?: string) {
    this.apiURL = apiURL || 'https://api.xeggex.com/api/v2';

    if (apiKey && apiSecret) {
      this.auth = "Basic " + Buffer.from(apiKey + ":" + apiSecret).toString("base64");
      this.options = {
        headers: {
          "Authorization": this.auth
        }
      };
    } else {
      this.options = {};
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.apiURL}/${endpoint}`;
    try {
      console.log(`Making request to: ${url}`);
      const response = await fetch(url, {
        ...this.options,
        ...options,
        headers: {
          ...this.options.headers,
          ...options.headers
        }
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`Error in XeggexApi.request to ${endpoint}:`, error);
      throw error;
    }
  }

  async getTicker(symbol: string): Promise<any> {
    const encodedSymbol = encodeURIComponent(symbol);
    return this.request(`ticker/${encodedSymbol}`);
  }

  async getBalances(): Promise<any> {
    return this.request('balances');
  }

  async getOpenOrders(symbol?: string, limit = 50, skip = 0): Promise<any> {
    const params = new URLSearchParams({
      status: 'active',
      symbol: symbol || '',
      limit: limit.toString(),
      skip: skip.toString()
    });
    return this.request(`getorders?${params.toString()}`);
  }

  async createLimitOrder(
    symbol: string,
    side: 'buy' | 'sell',
    quantity: number,
    price: number,
    userProvidedId: string | null = null,
    strictValidate = false
  ): Promise<any> {
    return this.request('createorder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        symbol,
        side,
        quantity,
        type: 'limit',
        price,
        userProvidedId,
        strictValidate
      })
    });
  }

  async cancelOrder(orderId: string): Promise<any> {
    return this.request('cancelorder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: orderId })
    });
  }

  async cancelAllOrders(symbol?: string, side?: 'buy' | 'sell'): Promise<any> {
    return this.request('cancelallorders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ symbol, side })
    });
  }
}

export default XeggexApi;
