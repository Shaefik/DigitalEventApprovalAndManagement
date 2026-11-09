// API layer prepared for a future Node.js/Express + MySQL backend.
// The UI currently uses AppContext (mock data + localStorage). To go live, call these
// functions from the context actions instead of mutating local state.
import axios from 'axios';

export const http = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });
http.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('cpems_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const authAPI = {
  login: (payload) => http.post('/auth/login', payload),
  adminLogin: (payload) => http.post('/auth/admin/login', payload),
  createAdmin: (payload) => http.post('/auth/admin', payload),
};
export const requestAPI = {
  list: (params) => http.get('/requests', { params }),
  create: (payload) => http.post('/requests', payload),
  decide: (id, payload) => http.post(`/requests/${id}/decision`, payload), // { decision, remarks }
};
export const masterAPI = (resource) => ({ // users, clubs, associations, events, departments, rooms
  list: () => http.get(`/${resource}`),
  create: (d) => http.post(`/${resource}`, d),
  update: (id, d) => http.put(`/${resource}/${id}`, d),
  remove: (id) => http.delete(`/${resource}/${id}`),
});
export const notificationAPI = { list: () => http.get('/notifications'), markRead: () => http.post('/notifications/read') };
