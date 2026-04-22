import api from './api';

export const createTeam = (payload) => api.post('/teams', payload);

export const getAllTeams = () => api.get('/teams');
