import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600">
          SkillExchange
        </Link>

        <div className="flex gap-6 items-center">
          {isAuthenticated ? (
            <>
              <Link to="/courses" className="text-gray-600 hover:text-gray-900">
                Courses
              </Link>
              {user?.role === 'admin' && (
                <>
                  <Link to="/admin/dashboard" className="text-gray-600 hover:text-gray-900">
                    Admin Panel
                  </Link>
                  <Link to="/student/dashboard" className="text-gray-600 hover:text-gray-900">
                    My Enrollments
                  </Link>
                </>
              )}
              {user?.role === 'student' && (
                <Link to="/student/dashboard" className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-gray-900">
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
