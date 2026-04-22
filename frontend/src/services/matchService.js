import api from './api';

export const createMatch = (payload) => api.post('/matches', payload);

export const getAllMatches = () => api.get('/matches');

export const getMatchById = (id) => api.get(`/matches/${id}`);

export const setupMatch = (id, payload) =>
  api.post(`/matches/${id}/setup`, payload);

export const setupInnings2 = (id, payload) =>
  api.post(`/matches/${id}/setup-innings2`, payload);

export const updateScore = (id, payload) =>
  api.post(`/matches/${id}/score`, payload);

export const newBatsman = (id, payload) =>
  api.post(`/matches/${id}/new-batsman`, payload);

export const newBowler = (id, payload) =>
  api.post(`/matches/${id}/new-bowler`, payload);

export const undoLastAction = (id) => api.post(`/matches/${id}/undo`);

export const deleteMatch = (id) => api.delete(`/matches/${id}`);

export const currentInningsOf = (match) => {
  if (!match || !match.innings || match.innings.length === 0) return null;
  return match.innings[match.innings.length - 1];
};
