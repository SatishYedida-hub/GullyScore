// Shared admin-mode state.
//
// A single cached snapshot of "is admin protection configured on the
// server" + "is my stored token currently accepted" is shared by the
// Navbar and every page that wants to conditionally show destructive UI
// (delete buttons). One fetch per page-load is plenty.

import { useEffect, useState } from 'react';

import { getAdminStatus } from '../services/adminService';
import { getAdminToken, useAdminToken } from './adminToken';

const EVENT = 'gullyscore:admin-status-changed';

// Shape: { configured: boolean, isAdmin: boolean, loaded: boolean }
let cached = { configured: false, isAdmin: false, loaded: false };
let inFlight = null;

const emit = () => {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT));
    }
  } catch (_) {
    /* ignore */
  }
};

export const getCachedAdminStatus = () => cached;

// Fetch once and share. Pass `force=true` after login/logout.
export const refreshAdminStatus = async (force = false) => {
  if (inFlight && !force) return inFlight;
  inFlight = (async () => {
    try {
      const { data } = await getAdminStatus();
      cached = {
        configured: !!data?.configured,
        isAdmin: !!data?.isAdmin,
        loaded: true,
      };
    } catch (_) {
      // Keep existing cache on error, but mark as loaded so UIs don't
      // spin forever.
      cached = { ...cached, loaded: true };
    } finally {
      inFlight = null;
      emit();
    }
    return cached;
  })();
  return inFlight;
};

// Hook: returns `{ configured, isAdmin, canDelete, loaded }`. `canDelete`
// is the single boolean most UIs care about — true when deleting is
// allowed for the current viewer.
export const useIsAdmin = () => {
  const [snapshot, setSnapshot] = useState(cached);
  const [adminToken] = useAdminToken();

  useEffect(() => {
    const sync = () => setSnapshot(getCachedAdminStatus());

    if (typeof window !== 'undefined') {
      window.addEventListener(EVENT, sync);
    }

    // Kick off a fetch if we've never loaded, and re-fetch whenever the
    // stored token changes (login / logout / 403-clear).
    refreshAdminStatus(cached.loaded ? true : false).then(sync);

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(EVENT, sync);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  const { configured, isAdmin, loaded } = snapshot;
  // If the server hasn't locked anything down, anyone can delete — we
  // don't want to hide buttons in that (dev) mode.
  const canDelete = !configured || (isAdmin && !!getAdminToken());

  return { configured, isAdmin, loaded, canDelete };
};
