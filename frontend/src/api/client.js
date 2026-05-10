import axios from 'axios';

const raw = import.meta.env.VITE_API_URL;
/** Use env base or same-origin `/api` (Vite proxies to backend in development). */
const baseURL =
  typeof raw === 'string' && raw.length > 0 ? raw.replace(/\/$/, '') : '/api';

export const api = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('ttm_auth');
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      localStorage.removeItem('ttm_auth');
    }
  }
  return config;
});
