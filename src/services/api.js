// src/services/api.js
import axios from 'axios';

// GANTIKAN DENGAN URL LIVE RENDER ANDA
const API_BASE_URL = 'https://wellspace-backend.onrender.com/api'; 

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Authentication Calls
export const loginUser = (loginData) => api.post('/auth/login', loginData);
export const registerUser = (userData) => api.post('/auth/register', userData);

export default api;