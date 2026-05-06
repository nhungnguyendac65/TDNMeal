import axios from 'axios';
export const BASE_URL = import.meta.env.VITE_SERVER_URL || (import.meta.env.MODE === 'production' ? window.location.origin : 'http://localhost:5000');

const api = axios.create({
    baseURL: `${BASE_URL}/api`, 
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'any'
    },
});

export const getFullUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path}`;
};

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);
export default api;