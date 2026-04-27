import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://parking-lot-backend-1msj.onrender.com/api",
  timeout: 10000,
  withCredentials: true,
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("API URL:", process.env.REACT_APP_API_URL);
  }
  return config;
});

// Handle global errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
