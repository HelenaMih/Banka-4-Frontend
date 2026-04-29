export type TestUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  identity_type: 'employee' | 'client';
  is_admin?: boolean;
  permissions: string[];
};

// Aktuar (agent) — zaposleni koji može da trguje
export const agentUser: TestUser = {
  id: 9002,
  first_name: 'Aca',
  last_name: 'Agent',
  email: 'agent@raf.rs',
  identity_type: 'employee',
  is_admin: false,
  permissions: ['orders.create'],
};

export const supervisorUser: TestUser = {
  id: 9001,
  first_name: 'Sanja',
  last_name: 'Supervizor',
  email: 'supervisor@raf.rs',
  identity_type: 'employee',
  is_admin: false,
  permissions: ['supervisor'],
};

export function tradingApiUrl(): string {
  return (Cypress.env('TRADING_API_URL') as string) ?? 'http://localhost:8082/api';
}

export function loginAs(user: TestUser, targetPath: string): void {
  cy.visit(targetPath, {
    onBeforeLoad(win) {
      win.localStorage.setItem('token', 'test-token');
      win.localStorage.setItem('refreshToken', 'test-refresh-token');
      win.localStorage.setItem('user', JSON.stringify(user));
    },
  });
}

// Backend format za akcije (pre mapStock transformacije)
export function buildStocks() {
  return [
    {
      listing_id: 1,
      ticker: 'MSFT',
      name: 'Microsoft Corporation',
      exchange: 'NASDAQ',
      price: 415.2,
      change: 3.5,
      change_percent: 0.85,
      volume: 22000000,
      bid: 415.0,
      ask: 415.4,
      maintenance_margin: 0,
      currency: 'USD',
    },
    {
      listing_id: 2,
      ticker: 'AAPL',
      name: 'Apple Inc.',
      exchange: 'NASDAQ',
      price: 188.5,
      change: -1.2,
      change_percent: -0.63,
      volume: 55000000,
      bid: 188.3,
      ask: 188.7,
      maintenance_margin: 0,
      currency: 'USD',
    },
    {
      listing_id: 3,
      ticker: 'JPM',
      name: 'JPMorgan Chase',
      exchange: 'NYSE',
      price: 195.0,
      change: 0.8,
      change_percent: 0.41,
      volume: 9000000,
      bid: 194.9,
      ask: 195.1,
      maintenance_margin: 0,
      currency: 'USD',
    },
  ];
}

export function buildFutures() {
  return [
    {
      listing_id: 10,
      ticker: 'ES',
      name: 'E-mini S&P 500',
      exchange: 'CME',
      price: 5200.0,
      change: -10.5,
      volume: 800000,
      bid: 5199.5,
      ask: 5200.5,
      maintenance_margin: 0,
      settlement_date: '2025-06-20',
      contract_size: 50,
      contract_unit: 'USD',
      currency: 'USD',
    },
  ];
}

export function buildForex() {
  return [
    {
      listing_id: 20,
      ticker: 'EUR/USD',
      name: 'Euro / US Dollar',
      exchange: 'FOREX',
      price: 1.08,
      change: 0.002,
      volume: 1000000000,
      bid: 1.0798,
      ask: 1.0802,
      maintenance_margin: 0,
      base: 'EUR',
      quote: 'USD',
      contract_size: 100000,
    },
  ];
}
