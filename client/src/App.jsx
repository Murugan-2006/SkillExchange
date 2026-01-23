import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CourseProvider } from './context/CourseContext';
import Navbar from './components/Navbar';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/courses" />;
  }

  return children;
};

const HomePage = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <h1 className="text-5xl font-bold text-gray-800 mb-4">Skill Exchange</h1>
      <p className="text-xl text-gray-600 mb-8">
        Learn by teaching. Earn credentials through project-based learning.
      </p>
      <div className="flex gap-4 justify-center">
        <a
          href="/courses"
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          Explore Courses
        </a>
        <a
          href="/register"
          className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition font-semibold"
        >
          Sign Up
        </a>
      </div>
    </div>
  </div>
);

function AppContent() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route
          path="/course/:courseId"
          element={
            <ProtectedRoute requiredRole="student">
              <CourseDetailPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CourseProvider>
        <AppContent />
      </CourseProvider>
    </AuthProvider>
  );
}
