import axios from 'axios';

import { clearAdminToken, getAdminToken } from '../utils/adminToken';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the admin key to every request that has one stored, so the server
// can recognise the owner on all protected endpoints without each caller
// having to plumb it through.
api.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) {
    config.headers = config.headers || {};
    // Respect an explicitly-set header (including empty string) — the verify
    // endpoint uses that to test a candidate without touching the stored key.
    if (!('X-Admin-Token' in config.headers)) {
      config.headers['X-Admin-Token'] = token;
    }
  }
  return config;
});

// If the server rejects our admin key (stale / rotated), drop it locally so
// the navbar reverts to the locked state and the user can re-enter.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const msg = error?.response?.data?.message || '';
    const looksAdminRejection =
      status === 403 && /admin|owner|unlock/i.test(msg);
    if (looksAdminRejection && getAdminToken()) {
      clearAdminToken();
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  'Something went wrong';

export default api;
