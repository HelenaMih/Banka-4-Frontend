import { tradingApi } from '../client';

export const investmentFundsApi = {
  createFund: (payload) =>
    tradingApi.post('/investment-funds', payload),

  getFunds: (params = {}) =>
    tradingApi.get('/investment-funds', { params }),

  // Swagger: GET /api/funds — all investment funds (public list)
  getAllFunds: (params = {}) =>
    tradingApi.get('/funds', { params }),

  getFundDetails: (fundId) =>
    tradingApi.get(`/investment-funds/${fundId}`),

  getFundAssets: (fundId) =>
    tradingApi.get(`/investment-funds/${fundId}/assets`),

  getFundPerformance: (fundId, range = 'monthly') =>
    tradingApi.get(`/investment-funds/${fundId}/performance`, { params: { range } }),

  getManagedFunds: () =>
    tradingApi.get('/me/funds'),

  depositToFund: (fundId, payload) =>
    tradingApi.post(`/investment-funds/${fundId}/deposit`, payload),

  withdrawFromFund: (fundId, payload) =>
    tradingApi.post(`/investment-funds/${fundId}/withdraw`, payload),

  investInFund: (fundId, payload) =>
    tradingApi.post(`/investment-funds/${fundId}/invest`, payload),

  sellFundAsset: (fundId, assetId, payload) =>
    tradingApi.post(`/investment-funds/${fundId}/assets/${assetId}/sell`, payload),

  // Swagger: GET /api/profit/funds — investment fund positions/profits
  getFundProfits: () =>
    tradingApi.get('/profit/funds'),

  // Swagger: GET /api/actuary/{actId}/assets/funds — funds managed by actuary
  getFundsManagedByActuary: (actId) =>
    tradingApi.get(`/actuary/${actId}/assets/funds`),

  getActuaryPerformances: () =>
    tradingApi.get('/profit-bank/actuaries'),

  getActuaryProfit: (actuaryId) =>
    tradingApi.get(`/actuary/${actuaryId}/assets/profit`),

  getClientProfit: (clientId) =>
    tradingApi.get(`/client/${clientId}/assets/profit`),
};