// Small helpers for persisting the per-match scorer key in localStorage.
// Whichever device holds a match's token is allowed to update its score;
// see backend/controllers/matchController.js.

const key = (matchId) => `gullyscore:scorer:${matchId}`;

export const getScorerToken = (matchId) => {
  if (!matchId || typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(key(matchId)) || '';
  } catch (_) {
    return '';
  }
};

export const setScorerToken = (matchId, token) => {
  if (!matchId || !token || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key(matchId), token);
  } catch (_) {
    // ignore quota / privacy-mode errors
  }
};

export const clearScorerToken = (matchId) => {
  if (!matchId || typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key(matchId));
  } catch (_) {
    // ignore
  }
};
