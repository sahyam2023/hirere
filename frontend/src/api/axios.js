import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7777/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Let the browser set the Content-Type for FormData
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    const message = error.response?.data?.detail || error.message || 'An error occurred';
    toast.error(message);
    
    return Promise.reject(error);
  }
);

export default api;

// API endpoints
export const authAPI = {
  login: (credentials) => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);
    return api.post('/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  register: (userData) => api.post('/register', userData),
  me: () => Promise.resolve({ data: { name: 'Dummy User', email: 'dummy@example.com' } }),
};

export const examAPI = {
  getExams: () => Promise.resolve({ data: [] }),
  getExam: (id) => api.get(`/exams/${id}`),
  submitExam: (examId, answers) => api.post(`/exams/submit`, { exam_id: examId, answers }),
  createExam: (examData) => api.post('/exams', examData),
};

export const faceAPI = {
  registerFace: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/proctor/register_face', formData);
  },
  verifyFace: (imageData) => Promise.resolve({ data: { verified: true } }),
};

export const proctorAPI = {
  sendFrame: (examId, sessionId, file) => {
    const formData = new FormData();
    formData.append('exam_id', examId);
    formData.append('session_id', sessionId);
    formData.append('file', file);
    return api.post('/proctor/frame', formData);
  },
  getLogs: (examId) => api.get('/proctor/logs', { params: { exam_id: examId } }),
  getSummary: (examId) => api.get('/proctor/summary', { params: { exam_id: examId } }),
};