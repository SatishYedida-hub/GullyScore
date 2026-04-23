import api from './api';
import { getScorerToken } from '../utils/scorerToken';

// Attach the stored scorer key (if any) so write endpoints pass the backend
// permission check. Reads also include it so the response can report
// whether this viewer currently holds the key (`isScorer`).
const withScorer = (id, config = {}) => {
  const token = getScorerToken(id);
  if (!token) return config;
  return {
    ...config,
    headers: {
      ...(config.headers || {}),
      'X-Scorer-Token': token,
    },
  };
};

export const createMatch = (payload) => api.post('/matches', payload);

export const getAllMatches = () => api.get('/matches');

export const getMatchById = (id) => api.get(`/matches/${id}`, withScorer(id));

export const setupMatch = (id, payload) =>
  api.post(`/matches/${id}/setup`, payload, withScorer(id));

export const setupInnings2 = (id, payload) =>
  api.post(`/matches/${id}/setup-innings2`, payload, withScorer(id));

export const updateScore = (id, payload) =>
  api.post(`/matches/${id}/score`, payload, withScorer(id));

export const newBatsman = (id, payload) =>
  api.post(`/matches/${id}/new-batsman`, payload, withScorer(id));

export const newBowler = (id, payload) =>
  api.post(`/matches/${id}/new-bowler`, payload, withScorer(id));

export const undoLastAction = (id) =>
  api.post(`/matches/${id}/undo`, {}, withScorer(id));

export const declareInnings = (id) =>
  api.post(`/matches/${id}/declare`, {}, withScorer(id));

export const endAsDraw = (id) =>
  api.post(`/matches/${id}/draw`, {}, withScorer(id));

export const deleteMatch = (id) =>
  api.delete(`/matches/${id}`, withScorer(id));

export const transferScorer = (id) =>
  api.post(`/matches/${id}/transfer-scorer`, {}, withScorer(id));

export const currentInningsOf = (match) => {
  if (!match || !match.innings || match.innings.length === 0) return null;
  return match.innings[match.innings.length - 1];
};
