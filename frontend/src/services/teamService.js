import api from './api';

export const createTeam = (payload) => api.post('/teams', payload);

export const getAllTeams = () => api.get('/teams');

export const getTeamById = (id) => api.get(`/teams/${id}`);

export const deleteTeam = (id) => api.delete(`/teams/${id}`);

export const removePlayer = (id, playerName) =>
  api.delete(`/teams/${id}/players/${encodeURIComponent(playerName)}`);

export const addPlayerToTeam = (id, name) =>
  api.post(`/teams/${id}/players`, { name });

export const updateTeamPhoto = (id, photo) =>
  api.put(`/teams/${id}/photo`, { photo });
