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
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  me: () => api.get('/auth/me'),
};

export const examAPI = {
  getExams: () => api.get('/exams'),
  getExam: (id) => api.get(`/exams/${id}`),
  submitExam: (examId, answers) => api.post(`/exam/submit`, { exam_id: examId, answers }),
  createExam: (examData) => api.post('/admin/exams', examData),
};

export const faceAPI = {
  registerFace: (imageData) => api.post('/face/register', { image: imageData }),
  verifyFace: (imageData) => api.post('/face/verify', { image: imageData }),
};

export const proctorAPI = {
  sendFrame: (examId, imageData) => api.post('/proctor/frame', { exam_id: examId, image: imageData }),
  getLogs: (examId) => api.get(`/proctor/logs/${examId}`),
  getSummary: (examId) => api.get(`/proctor/summary/${examId}`),
};