import api from './api';

export const createMatch = (payload) => api.post('/matches', payload);

export const getAllMatches = () => api.get('/matches');

export const getMatchById = (id) => api.get(`/matches/${id}`);

export const updateScore = (id, payload) =>
  api.post(`/matches/${id}/score`, payload);
