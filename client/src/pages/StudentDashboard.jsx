import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { enrollmentService, creditsService, withdrawalService } from '../services/api';
import WithdrawCredits from '../components/WithdrawCredits';
import WithdrawalHistory from '../components/WithdrawalHistory';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState({ balance: 0 });
  const [withdrawConfig, setWithdrawConfig] = useState(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showWithdrawalHistory, setShowWithdrawalHistory] = useState(false);

  useEffect(() => {
    fetchEnrollments();
    fetchCredits();
    fetchWithdrawConfig();
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

  const fetchCredits = async () => {
    try {
      const response = await creditsService.getCredits();
      setCredits(response.data.credits);
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const fetchWithdrawConfig = async () => {
    try {
      const response = await withdrawalService.getConfig();
      setWithdrawConfig(response.data);
    } catch (error) {
      console.error('Error fetching withdraw config:', error);
    }
  };

  const handleWithdrawSuccess = (result) => {
    // Refresh credits after withdrawal
    fetchCredits();
    fetchWithdrawConfig();
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
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-lg shadow text-white">
            <h3 className="text-white text-sm font-medium mb-2 opacity-90">Learning Credits</h3>
            <p className="text-3xl font-bold">{credits?.balance || 0}</p>
            {withdrawConfig?.config && (
              <p className="text-xs mt-1 opacity-80">
                = ₹{((credits?.balance || 0) * withdrawConfig.config.conversionRate).toLocaleString()}
              </p>
            )}
            {/* Always show withdraw button, but disable if not eligible */}
            {withdrawConfig?.config && (
              <>
                {withdrawConfig?.userStatus?.canWithdraw ? (
                  <button
                    onClick={() => setShowWithdrawModal(true)}
                    className="mt-3 w-full bg-white text-orange-600 py-2 px-4 rounded-lg text-sm font-semibold hover:bg-orange-50 transition"
                  >
                    💰 Withdraw as Money
                  </button>
                ) : withdrawConfig?.userStatus?.hasPendingWithdrawal ? (
                  <p className="mt-3 text-xs bg-white/20 rounded px-3 py-2 text-center">
                    ⏳ Withdrawal in progress...
                  </p>
                ) : (
                  <div className="mt-3">
                    <button
                      onClick={() => setShowWithdrawModal(true)}
                      className="w-full bg-white/30 text-white py-2 px-4 rounded-lg text-sm font-semibold cursor-pointer hover:bg-white/40 transition"
                    >
                      💰 Withdraw as Money
                    </button>
                    <p className="text-xs mt-1 opacity-80 text-center">
                      Min {withdrawConfig.config.minCredits} credits required
                    </p>
                  </div>
                )}
              </>
            )}
            <button
              onClick={() => setShowWithdrawalHistory(true)}
              className="mt-2 w-full text-white/80 hover:text-white text-xs underline"
            >
              View Withdrawal History
            </button>
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

      {/* Withdraw Credits Modal */}
      {showWithdrawModal && (
        <WithdrawCredits
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={handleWithdrawSuccess}
        />
      )}

      {/* Withdrawal History Modal */}
      {showWithdrawalHistory && (
        <WithdrawalHistory
          onClose={() => setShowWithdrawalHistory(false)}
        />
      )}
    </div>
  );
}
