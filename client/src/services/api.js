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

// Notes Services
export const notesService = {
  uploadNote: (courseId, data) => api.post(`/notes/${courseId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getNotesByCourse: (courseId) => api.get(`/notes/course/${courseId}`),
  deleteNote: (noteId) => api.delete(`/notes/${noteId}`),
};

// Credits Services
export const creditsService = {
  getCredits: () => api.get('/credits'),
  getTransactionHistory: () => api.get('/credits/history'),
};

// Withdrawal Services
export const withdrawalService = {
  getConfig: () => api.get('/withdrawals/config'),
  updateBankDetails: (data) => api.put('/withdrawals/bank-details', data),
  requestWithdrawal: (data) => api.post('/withdrawals/request', data),
  getHistory: () => api.get('/withdrawals/history'),
  getDetails: (withdrawalId) => api.get(`/withdrawals/${withdrawalId}`),
  cancelWithdrawal: (withdrawalId) => api.post(`/withdrawals/${withdrawalId}/cancel`),
  // Admin
  getAllWithdrawals: (params) => api.get('/withdrawals/admin/all', { params }),
  processWithdrawal: (withdrawalId) => api.post(`/withdrawals/admin/${withdrawalId}/process`),
  completeWithdrawal: (withdrawalId, data) => api.post(`/withdrawals/admin/${withdrawalId}/complete`, data),
  rejectWithdrawal: (withdrawalId, data) => api.post(`/withdrawals/admin/${withdrawalId}/reject`, data),
};

// Feedback Services
export const feedbackService = {
  submitFeedback: (courseId, data) => api.post(`/feedback/${courseId}`, data),
  checkFeedback: (courseId) => api.get(`/feedback/check/${courseId}`),
  getCourseFeedback: (courseId) => api.get(`/feedback/course/${courseId}`),
};

// Payment Services
export const paymentService = {
  payWithCredits: (courseId) => api.post('/payments/credits', { courseId }),
  createStripeIntent: (courseId) => api.post('/payments/stripe/intent', { courseId }),
  verifyStripePayment: (paymentId, paymentIntentId) => 
    api.post('/payments/stripe/verify', { paymentId, paymentIntentId }),
  demoPayment: (courseId) => api.post('/payments/demo', { courseId }),      // Demo payment
  freeEnroll: (courseId) => api.post('/payments/free', { courseId }),       // Free enrollment
  getPaymentHistory: () => api.get('/payments/history'),
  getPaymentDetails: (paymentId) => api.get(`/payments/${paymentId}`),
  getAllPayments: () => api.get('/payments'),
  // PhonePe Payment
  initiatePhonePePayment: (courseId) => api.post('/payments/phonepe/initiate', { courseId }),
  checkPhonePeStatus: (paymentId) => api.get(`/payments/phonepe/check/${paymentId}`),
};

export default api;
