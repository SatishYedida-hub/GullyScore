// Tiny admin-access helper.
//
// A single owner-level token gated by the `ADMIN_TOKEN` env var is required
// for destructive actions (delete team, delete roster player, delete match,
// remove player from team). Anything read-only or "create/update" stays open
// so friends can still add teams/players.
//
// If `ADMIN_TOKEN` is not set, admin protection is DISABLED (backward
// compatibility for local dev / first-run deploys). A warning is logged once
// at require-time.

let warnedMissing = false;

const getConfiguredToken = () => {
  const t = process.env.ADMIN_TOKEN;
  if (typeof t !== 'string') return '';
  return t.trim();
};

const isAdminConfigured = () => !!getConfiguredToken();

// Clients send the admin key as `X-Admin-Token` header, or (fallback) as
// `adminToken` in the JSON body.
const readAdminToken = (req) =>
  req.get('x-admin-token') ||
  (req.body && typeof req.body.adminToken === 'string'
    ? req.body.adminToken
    : '');

const timingSafeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
};

const isAdminRequest = (req) => {
  const configured = getConfiguredToken();
  if (!configured) {
    // No admin configured → anyone is treated as admin so the app stays
    // fully functional until the owner opts in.
    if (!warnedMissing) {
      console.warn(
        '[admin] ADMIN_TOKEN is not set. Delete endpoints are OPEN. ' +
          'Set ADMIN_TOKEN in the backend environment to restrict deletes ' +
          'to just you.'
      );
      warnedMissing = true;
    }
    return true;
  }
  return timingSafeEqual(readAdminToken(req), configured);
};

// Express middleware: 403 if the caller is not the admin.
const requireAdmin = (req, res, next) => {
  if (isAdminRequest(req)) return next();
  const err = new Error(
    'Only the app owner can perform this action. Unlock admin mode and try again.'
  );
  err.status = 403;
  return next(err);
};

module.exports = {
  isAdminConfigured,
  isAdminRequest,
  requireAdmin,
};
