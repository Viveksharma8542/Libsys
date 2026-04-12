import axios from 'axios';

const api = axios.create({
  // Use `REACT_APP_API_URL` when set, otherwise rely on the dev-server proxy
  // by using a relative `/api` path. This avoids hardcoding ports.
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue = [];
const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry && err.response.data?.code === 'TOKEN_EXPIRED') {
      if (isRefreshing) {
        return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
          .then(token => { original.headers.Authorization = `Bearer ${token}`; return api(original); });
      }
      original._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem('refreshToken');
      try {
        const refreshBase = process.env.REACT_APP_API_URL || '/api';
        const refreshUrl = `${refreshBase.replace(/\/$/, '')}/auth/refresh`;
        const { data } = await axios.post(refreshUrl, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefresh);
        processQueue(null, accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (e) {
        processQueue(e, null); localStorage.clear(); window.location.href = '/login';
        return Promise.reject(e);
      } finally { isRefreshing = false; }
    }
    return Promise.reject(err);
  }
);

export default api;
