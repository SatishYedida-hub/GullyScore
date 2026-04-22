import api from './api';

export const createMatch = (payload) => api.post('/matches', payload);

export const getAllMatches = () => api.get('/matches');

export const getMatchById = (id) => api.get(`/matches/${id}`);

export const setupMatch = (id, payload) =>
  api.post(`/matches/${id}/setup`, payload);

export const updateScore = (id, payload) =>
  api.post(`/matches/${id}/score`, payload);

export const newBatsman = (id, payload) =>
  api.post(`/matches/${id}/new-batsman`, payload);

export const newBowler = (id, payload) =>
  api.post(`/matches/${id}/new-bowler`, payload);
