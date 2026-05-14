import { supervisorUser, agentUser, loginAs } from '../../support/helpers';

export { supervisorUser, agentUser, loginAs };

export function tradingApiUrl(): string {
  const url = Cypress.env('TRADING_API_URL') as string | undefined;
  return url && !url.includes('localhost') ? url : 'http://rafsi.davidovic.io:8082/api';
}

export function bankingApiUrl(): string {
  const url = Cypress.env('BANKING_API_URL') as string | undefined;
  return url && !url.includes('localhost') ? url : 'http://rafsi.davidovic.io:8081/api';
}

export const mockActuaries = [
  {
    actuary_id: 101,
    first_name: 'Milan',
    last_name: 'Marković',
    position: 'AGENT',
    profit_rsd: 150000.5,
  },
  {
    actuary_id: 102,
    first_name: 'Sara',
    last_name: 'Supervizor',
    position: 'SUPERVISOR',
    profit_rsd: 320000.0,
  },
];

export const mockFunds = [
  {
    fund_id: 1,
    fund_name: 'Alpha Fond',
    manager_name: 'Sara Supervizor',
    bank_share_pct: 25.0,
    bank_share_value: 500000,
    profit: 30000,
    liquidity_rsd: 200000,
    liquid_assets: 200000,
  },
];

export const mockBankAccounts = [
  {
    account_number: '340-111-222-33',
    name: 'Tekući račun banke',
    account_type: 'bank',
    company_id: 1,
    balance: 1000000,
    currency: 'RSD',
  },
];
