import api from './api';

// Reads the server's view of admin protection. The `isAdmin` flag reflects
// whatever token is currently stored in localStorage (the request
// interceptor attaches it automatically).
export const getAdminStatus = () => api.get('/admin/status');

// Validate a candidate token WITHOUT storing it first. The caller passes
// the key explicitly so we don't clobber an already-good stored token if
// the user types a bad one.
export const verifyAdminToken = (token) =>
  api.post(
    '/admin/verify',
    {},
    {
      headers: {
        'X-Admin-Token': token || '',
      },
    }
  );
