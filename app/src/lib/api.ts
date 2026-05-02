import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const tempToken = localStorage.getItem('tempToken'); // used for 2FA verification

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (tempToken) {
      config.headers.Authorization = `Bearer ${tempToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear tokens and redirect to login if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // We don't want to redirect forcefully if we're just checking auth status, 
      // but usually 401 on protected routes means logout.
      if (window.location.pathname !== '/login' && window.location.pathname !== '/setup') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
