import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { enrollmentService } from '../services/api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const response = await enrollmentService.getEnrollments();
      setEnrollments(response.data.enrollments);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600">Track your learning progress</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Courses Enrolled</h3>
            <p className="text-3xl font-bold text-blue-600">{enrollments.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium mb-2">In Progress</h3>
            <p className="text-3xl font-bold text-green-600">
              {enrollments.filter((e) => e.status === 'active').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Completed</h3>
            <p className="text-3xl font-bold text-purple-600">
              {enrollments.filter((e) => e.status === 'completed').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Learning Credits</h3>
            <p className="text-3xl font-bold text-yellow-600">50</p>
          </div>
        </div>

        {/* My Courses */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">My Courses</h2>

          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">You haven't enrolled in any courses yet</p>
              <a
                href="/courses"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Browse Courses
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <div 
                  key={enrollment._id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition cursor-pointer"
                  onClick={() => navigate(`/course/${enrollment.course._id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {enrollment.course?.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Progress: {enrollment.progress?.watchPercentage || 0}%
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        enrollment.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {enrollment.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                  <div className="mt-3 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${enrollment.progress?.watchPercentage || 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
