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
import PaymentStatusPage from './pages/PaymentStatusPage';

// Protected Route Component - No role restrictions, any authenticated user can access all features
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  // If token exists but profile is loading, show a spinner instead of blank page
  if (isAuthenticated && loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const highlights = [
    {
      title: 'Learn live',
      text: 'Join guided sessions and watch skills turn into real projects.',
      image:
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
    },
    {
      title: 'Build together',
      text: 'Collaborate on practical assignments that showcase your growth.',
      image:
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    },
    {
      title: 'Earn proof',
      text: 'Complete milestones, earn credentials, and display your progress.',
      image:
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
    },
  ];

  const stats = [
    { value: 'Live', label: 'project-based learning' },
    { value: 'Earn', label: 'credits and certificates' },
    { value: 'Share', label: 'skills with a community' },
  ];
  
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eef4ff]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(37,99,235,0.16),_transparent_28%),linear-gradient(135deg,_#eef4ff_0%,_#f8fbff_45%,_#eaf1ff_100%)]" />
      <div className="absolute -left-24 top-28 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
      <div className="absolute right-0 top-16 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              Learn by teaching, earn by building
            </div>

            <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
              Skill Exchange
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600 sm:text-xl">
              A project-first learning platform where you can teach, collaborate, complete real work, and earn credentials that matter.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              {isAuthenticated ? (
                <a
                  href="/student/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-white/80 px-8 py-4 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
                >
                  My Dashboard
                </a>
              ) : (
                <a
                  href="/register"
                  className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-white/80 px-8 py-4 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Sign Up
                </a>
              )}
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
                  <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                  <div className="mt-1 text-sm text-slate-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-8 hidden rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-lg backdrop-blur lg:block">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Featured experience</p>
              <p className="mt-1 text-sm text-slate-700">Practical learning, visible outcomes.</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {highlights.map((item, index) => (
                <div
                  key={item.title}
                  className={`group overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_18px_60px_rgba(37,99,235,0.12)] backdrop-blur transition duration-300 hover:-translate-y-1 ${index === 0 ? 'sm:col-span-2' : ''}`}
                >
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/15 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                      <h3 className="text-xl font-semibold">{item.title}</h3>
                      <p className="mt-1 max-w-md text-sm text-white/90">{item.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-lg backdrop-blur sm:grid-cols-3">
              <div>
                <p className="text-sm font-semibold text-blue-700">Project showcase</p>
                <p className="mt-1 text-sm text-slate-600">Show your work with confidence.</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-700">Guided milestones</p>
                <p className="mt-1 text-sm text-slate-600">Track progress from start to finish.</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-700">Real rewards</p>
                <p className="mt-1 text-sm text-slate-600">Turn skill growth into proof.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
            <ProtectedRoute>
              <CourseDetailPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment/status"
          element={
            <ProtectedRoute>
              <PaymentStatusPage />
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
