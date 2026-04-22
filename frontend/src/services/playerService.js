import api from './api';

export const getAllPlayers = () => api.get('/players');

export const getPlayerByName = (name) =>
  api.get(`/players/${encodeURIComponent(name)}`);
