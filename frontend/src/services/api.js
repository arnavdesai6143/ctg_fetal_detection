import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('ctg_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Token expired or invalid - clear and redirect
            localStorage.removeItem('ctg_token');
            localStorage.removeItem('ctg_user');

            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    logout: () => api.post('/auth/logout'),
    getProfile: () => api.get('/auth/profile'),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
    changePassword: (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword }),
};

// Patient API
export const patientAPI = {
    getAll: () => api.get('/patients'),
    getById: (id) => api.get(`/patients/${id}`),
    getCTG: (id) => api.get(`/patients/${id}/ctg`),
    updateNotes: (id, notes) => api.patch(`/patients/${id}/notes`, { notes }),
};

// Prediction API
export const predictionAPI = {
    predict: (features) => api.post('/predict', features),
    getModels: () => api.get('/models'),
    getActiveModels: () => api.get('/models/active'),
    getModelMetrics: (modelId) => api.get(`/models/${modelId}/metrics`),
    getModelComparison: () => api.get('/models/compare/all'),
};

// Reports API
export const reportsAPI = {
    getAll: (filters = {}) => api.get('/reports', { params: filters }),
    getById: (id) => api.get(`/reports/${id}`),
    generate: (patientId, modelVersion) => api.post('/reports', { patientId, modelVersion }),
    download: (id) => api.get(`/reports/${id}/download`, { responseType: 'blob' }),
};

// Admin API
export const adminAPI = {
    getAuditLogs: (filters = {}) => api.get('/admin/audit-logs', { params: filters }),
    getUsers: () => api.get('/admin/users'),
    createUser: (userData) => api.post('/admin/users', userData),
    updateUser: (id, userData) => api.patch(`/admin/users/${id}`, userData),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    getStats: () => api.get('/admin/stats'),
    updateModelStatus: (modelId, status) => api.patch(`/models/${modelId}`, { status }),
};

// Upload API
export const uploadAPI = {
    uploadExcel: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/upload/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    getStatus: () => api.get('/upload/status'),
    clearData: () => api.delete('/upload/clear'),
};

export default api;
