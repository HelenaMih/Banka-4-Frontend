import axios from 'axios';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

const BASE = import.meta.env.VITE_API_URL.replace(/\/$/, '');

function parseJwtExp(token) {
  try {
    return JSON.parse(atob(token.split('.')[1])).exp * 1000;
  } catch {
    return null;
  }
}

/**
 * Proaktivno osvežava access token 60s pre isteka.
 * Poziva se u App.jsx jednom za celu aplikaciju.
 */
export function useTokenRefresh() {
  const token = useAuthStore(s => s.token);

  useEffect(() => {
    if (!token) return;

    const exp = parseJwtExp(token);
    if (!exp) return;

    const delay = exp - Date.now() - 60_000;

    async function doRefresh() {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken || refreshToken === 'undefined') return;
      try {
        const res = await axios.post(
          `${BASE}/auth/refresh`,
          { refresh_token: refreshToken },
        );
        const newToken   = res.data.token;
        const newRefresh = res.data.refresh_token || refreshToken;
        const currentUser = useAuthStore.getState().user;
        useAuthStore.getState().setAuth(currentUser, newToken, newRefresh);
      } catch {
        // Ne radimo ništa — 401 interceptor će preuzeti ako zahtev padne
      }
    }

    if (delay <= 0) {
      doRefresh();
      return;
    }

    const timer = setTimeout(doRefresh, delay);
    return () => clearTimeout(timer);
  }, [token]);
}
