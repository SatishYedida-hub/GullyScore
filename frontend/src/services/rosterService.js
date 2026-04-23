import api from './api';

export const getRoster = () => api.get('/roster');

export const addRosterPlayer = (name) => api.post('/roster', { name });

export const deleteRosterPlayer = (id) => api.delete(`/roster/${id}`);

export const updatePlayerPhoto = (id, photo) =>
  api.put(`/roster/${id}/photo`, { photo });
