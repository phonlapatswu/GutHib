import axios from 'axios';
import Cookies from 'js-cookie';

/**
 * Global API Client (Axios Instance)
 * Configured with baseURL and automatic Authorization header injection.
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor: Centralized Security
 * This interceptor intercepts every outgoing request and injects the JWT token
 * if it exists in the browser cookies. This ensures all authenticated routes 
 * work seamlessly without manual header management.
 */
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Response interceptor to handle global errors (e.g., 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized (e.g., clear cookies and redirect to login)
      // Since this is generic, we might let the client handle it, but throwing here is good.
      Cookies.remove('token');
      // For Next.js App Router, global redirects from axios interceptors are tricky without context
      // Usually it's handled in a wrapper or the page itself
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
