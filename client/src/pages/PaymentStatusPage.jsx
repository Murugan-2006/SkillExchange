import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PaymentStatusPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [status, setStatus] = useState('loading');
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');

  const paymentId = searchParams.get('paymentId');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (paymentId) {
      checkPaymentStatus();
    } else {
      setStatus('error');
      setError('No payment ID found');
    }
  }, [paymentId, isAuthenticated]);

  const checkPaymentStatus = async () => {
    try {
      // Check payment status with PhonePe
      const response = await paymentService.checkPhonePeStatus(paymentId);
      if (response.data.success) {
        setPayment(response.data.payment);
        if (response.data.payment.status === 'completed') {
          setStatus('success');
        } else if (response.data.payment.status === 'failed') {
          setStatus('failed');
          setError('Payment was declined or failed');
        } else {
          setStatus('pending');
        }
      } else {
        setStatus('error');
        setError(response.data.message || 'Failed to check payment status');
      }
    } catch (err) {
      console.error('Payment status check error:', err);
      setStatus('error');
      setError(err.response?.data?.message || 'Failed to verify payment');
    }
  };

  const handleGoToDashboard = () => {
    if (user?.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/student/dashboard');
    }
  };

  const handleGoToCourses = () => {
    navigate('/courses');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin h-16 w-16 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Verifying Payment</h2>
            <p className="text-gray-600">Please wait while we confirm your payment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">
              You have been successfully enrolled in the course.
            </p>
            {payment && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Amount:</span> ₹{payment.amount}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Transaction ID:</span> {payment.transactionId}
                </p>
                {payment.course?.title && (
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Course:</span> {payment.course.title}
                  </p>
                )}
              </div>
            )}
            <button
              onClick={handleGoToDashboard}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
            >
              Go to Dashboard
            </button>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-yellow-600 mb-2">Payment Pending</h2>
            <p className="text-gray-600 mb-4">
              Your payment is being processed. This may take a few moments.
            </p>
            <button
              onClick={checkPaymentStatus}
              className="w-full bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 transition font-semibold mb-3"
            >
              Check Status Again
            </button>
            <button
              onClick={handleGoToCourses}
              className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition"
            >
              Back to Courses
            </button>
          </>
        )}

        {(status === 'failed' || status === 'error') && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-4">{error || 'Something went wrong with your payment.'}</p>
            <button
              onClick={handleGoToCourses}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
