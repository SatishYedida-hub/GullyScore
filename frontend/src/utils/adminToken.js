// Admin (owner) key storage + React hook.
//
// The app owner sets `ADMIN_TOKEN` on the server and types that same value
// into the "Admin" modal in the navbar. We persist it in localStorage and
// attach it to destructive requests via the `X-Admin-Token` header. A 403
// response should clear the stored key (see services/api.js interceptor).

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'gullyscore:adminToken';
const EVENT = 'gullyscore:admin-changed';

const safeWindow = () => (typeof window === 'undefined' ? null : window);

export const getAdminToken = () => {
  const w = safeWindow();
  if (!w) return '';
  try {
    return w.localStorage.getItem(STORAGE_KEY) || '';
  } catch (_) {
    return '';
  }
};

export const setAdminToken = (token) => {
  const w = safeWindow();
  if (!w) return;
  try {
    if (token) w.localStorage.setItem(STORAGE_KEY, token);
    else w.localStorage.removeItem(STORAGE_KEY);
  } catch (_) {
    /* ignore quota / privacy-mode errors */
  }
  try {
    w.dispatchEvent(new CustomEvent(EVENT));
  } catch (_) {
    /* ignore */
  }
};

export const clearAdminToken = () => setAdminToken('');

// React hook: returns the current stored token and re-renders when it
// changes (either from this tab via setAdminToken, or from another tab
// via the storage event).
export const useAdminToken = () => {
  const [token, setToken] = useState(getAdminToken);

  useEffect(() => {
    const w = safeWindow();
    if (!w) return undefined;

    const sync = () => setToken(getAdminToken());

    const onStorage = (e) => {
      if (!e || e.key === STORAGE_KEY) sync();
    };

    w.addEventListener('storage', onStorage);
    w.addEventListener(EVENT, sync);
    return () => {
      w.removeEventListener('storage', onStorage);
      w.removeEventListener(EVENT, sync);
    };
  }, []);

  const update = useCallback((next) => {
    setAdminToken(next || '');
  }, []);

  return [token, update];
};
