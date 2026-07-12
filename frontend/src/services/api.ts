import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let activeRequests = 0;

function updateLoadingState(delta: number) {
  activeRequests = Math.max(0, activeRequests + delta);
  // Dispatch a global event that components (like GlobalLoader) can listen to
  window.dispatchEvent(new CustomEvent('api-loading', { detail: { loading: activeRequests > 0 } }));
}

// Request Interceptor: Attach JWT Token if available and increment loading count
api.interceptors.request.use(
  (config) => {
    updateLoadingState(1);
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    updateLoadingState(-1);
    return Promise.reject(error);
  }
);

// Response Interceptor: Redirect or logout on 401, decrement loading count
api.interceptors.response.use(
  (response) => {
    updateLoadingState(-1);
    return response;
  },
  (error) => {
    updateLoadingState(-1);
    if (error.response && error.response.status === 401) {
      // Clear token and alert user or refresh page
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // If we are not on the login page already, redirect to it
      if (!window.location.pathname.endsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
