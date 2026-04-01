/*
import api from '../client';

export const portfolioApi = {
  // Putanje koje je backend lead potvrdio
  getClientAssets: (clientId) => api.get(`/client/${clientId}/assets`),
  getActuaryAssets: (actId) => api.get(`/actuary/${actId}/assets`),
  
  // Akcija za OTC (Admin/Supervisor)
  makePublic: (assetId, amount) => api.post(`/portfolio/make-public`, { assetId, amount }),
  
  // Akcija za Exercise (Aktuar)
  exerciseOption: (optionId) => api.post(`/portfolio/exercise/${optionId}`)
};
*/