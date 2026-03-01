import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { enrollmentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PaymentModal from './PaymentModal';

export default function CourseCard({ course, onEnrollSuccess }) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(false);

  // Check if user is already enrolled
  useEffect(() => {
    const checkEnrollment = async () => {
      if (!isAuthenticated || !course?._id) return;
      
      try {
        setCheckingEnrollment(true);
        const response = await enrollmentService.getEnrollments();
        const enrollments = response.data.enrollments || [];
        const enrolled = enrollments.some(
          (e) => e.course?._id === course._id || e.course === course._id
        );
        setIsEnrolled(enrolled);
      } catch (error) {
        console.error('Error checking enrollment:', error);
      } finally {
        setCheckingEnrollment(false);
      }
    };
    
    checkEnrollment();
  }, [isAuthenticated, course?._id]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // If already enrolled, go to course page
    if (isEnrolled) {
      navigate(`/course/${course._id}`);
      return;
    }

    // All courses now have a price (default ₹1000), so always open payment modal
    setIsPaymentModalOpen(true);
  };

  const handleEnrollSuccess = () => {
    // Mark as enrolled immediately
    setIsEnrolled(true);
    
    if (onEnrollSuccess) {
      onEnrollSuccess();
    } else {
      // Navigate to course page after successful enrollment
      navigate(`/course/${course._id}`);
    }
  };

  return (
    <>
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
            <div className="flex gap-1">
              {isEnrolled && (
                <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">
                  ✓ Enrolled
                </span>
              )}
              <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {course.level}
              </span>
            </div>
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
            <div className="flex gap-2">
              {(course.price && course.price > 0) || !course.price ? (
                <span className="text-sm font-semibold text-indigo-600">
                  ₹{course.price || 1000}
                </span>
              ) : null}
              {course.creditsRequired > 0 && (
                <span className="text-sm font-semibold text-yellow-600">
                  {course.creditsRequired} credits
                </span>
              )}
            </div>
          </div>

          {isEnrolled ? (
            <button
              onClick={handleEnroll}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2"
            >
              <span>📚</span>
              <span>Continue Learning</span>
            </button>
          ) : (
            <button
              onClick={handleEnroll}
              disabled={checkingEnrollment}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>🛒</span>
              <span>Buy Now - ₹{course.price || 1000}</span>
            </button>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        course={course}
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handleEnrollSuccess}
      />
    </>
  );
}
