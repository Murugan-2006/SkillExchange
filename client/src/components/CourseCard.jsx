import React from 'react';
import { useNavigate } from 'react-router-dom';
import { enrollmentService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CourseCard({ course }) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      await enrollmentService.enrollCourse({ courseId: course._id });
      alert('Enrolled successfully!');
      if (user?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Enrollment failed');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      {course.thumbnail && (
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-40 object-cover"
        />
      )}
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-800 flex-1">{course.title}</h3>
          <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {course.level}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>

        {course.skillsCovered.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {course.skillsCovered.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            {course.enrollmentCount} students
          </div>
          {course.creditsRequired > 0 && (
            <div className="text-sm font-semibold text-yellow-600">
              {course.creditsRequired} credits
            </div>
          )}
        </div>

        <button
          onClick={handleEnroll}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Enroll Now
        </button>
      </div>
    </div>
  );
}
