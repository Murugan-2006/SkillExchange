import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth Services
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// Course Services
export const courseService = {
  getAllCourses: (params) => api.get('/courses', { params }),
  getCourseById: (id) => api.get(`/courses/${id}`),
  createCourse: (data) => api.post('/courses', data),
  updateCourse: (id, data) => api.put(`/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
};

// Enrollment Services
export const enrollmentService = {
  enrollCourse: (data) => api.post('/enrollments', data),
  getEnrollments: () => api.get('/enrollments'),
  getEnrollmentById: (id) => api.get(`/enrollments/${id}`),
  updateProgress: (id, data) => api.put(`/enrollments/${id}/progress`, data),
};

// Video Services
export const videoService = {
  uploadVideo: (courseId, data) => api.post(`/videos/${courseId}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getVideosByCourse: (courseId) => api.get(`/videos/course/${courseId}`),
  getVideoById: (videoId) => api.get(`/videos/${videoId}`),
  deleteVideo: (videoId) => api.delete(`/videos/${videoId}`),
};

export default api;
