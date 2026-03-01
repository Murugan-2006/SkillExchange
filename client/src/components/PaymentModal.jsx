import React, { useState, useEffect } from 'react';
import { paymentService, creditsService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PaymentModal({ course, isOpen, onClose, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('phonepe');
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [phonePeStep, setPhonePeStep] = useState(0); // For PhonePe payment animation
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetchCredits();
      setPhonePeStep(0);
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  const fetchCredits = async () => {
    try {
      const response = await creditsService.getCredits();
      setCredits(response.data.credits?.balance || 0);
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const handleCreditPayment = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await paymentService.payWithCredits(course._id);
      setSuccess('✅ Enrolled successfully using credits!');
      // Dispatch event to update credits in Navbar
      window.dispatchEvent(new CustomEvent('creditsUpdated'));
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  // Free Enrollment
  const handleFreeEnrollment = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await paymentService.freeEnroll(course._id);
      setSuccess('✅ Successfully enrolled in free course!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  // PhonePe Payment
  const handlePhonePePayment = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    // Simulate payment steps
    const steps = [
      'Initiating PhonePe payment...',
      'Connecting to payment gateway...',
      'Processing payment...',
      'Confirming transaction...',
    ];

    for (let i = 0; i < steps.length; i++) {
      setPhonePeStep(i + 1);
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    try {
      // Call backend PhonePe initiation endpoint
      const response = await paymentService.initiatePhonePePayment(course._id);
      
      if (response.data.success) {
        if (response.data.redirectUrl) {
          // Redirect to PhonePe payment page
          window.location.href = response.data.redirectUrl;
        } else {
          setSuccess('✅ Payment initiated successfully!');
        }
      } else {
        setError(response.data.message || 'Payment initiation failed');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'PhonePe payment failed');
    } finally {
      setLoading(false);
      setPhonePeStep(0);
    }
  };

  if (!isOpen) return null;

  const creditsRequired = course.creditsRequired || 0;
  const sufficientCredits = credits >= creditsRequired;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Enroll in Course</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-500 rounded-full p-1"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 text-lg">{course.title}</h3>
            <p className="text-gray-600 text-sm mt-2">{course.description}</p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          {/* Payment Method Selection */}
          <div className="space-y-4 mb-6">
            {/* Credits Option - Always show if course has creditsRequired OR as a payment option */}
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                paymentMethod === 'credits'
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => setPaymentMethod('credits')}
            >
              <div className="flex items-start">
                <input
                  type="radio"
                  name="payment"
                  value="credits"
                  checked={paymentMethod === 'credits'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">💰 Pay with Credits</p>
                  <p className="text-sm text-gray-600">
                    Cost: <span className="font-bold text-yellow-600">{creditsRequired > 0 ? `${creditsRequired} credits` : 'Free (0 credits)'}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Your balance: <span className={sufficientCredits ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                      {credits} credits
                    </span>
                  </p>
                  {!sufficientCredits && creditsRequired > 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ Insufficient credits. You need {creditsRequired - credits} more credits.
                    </p>
                  )}
                  {creditsRequired === 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ This course is free! No credits needed.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* PhonePe Payment Option - Primary payment method */}
            {(course.price && course.price > 0) && (
              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                  paymentMethod === 'phonepe'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setPaymentMethod('phonepe')}
              >
                <div className="flex items-start">
                  <input
                    type="radio"
                    name="payment"
                    value="phonepe"
                    checked={paymentMethod === 'phonepe'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800">📱 Pay with PhonePe</p>
                      <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">Recommended</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Amount: <span className="font-bold text-indigo-600">₹{course.price || 1000}</span>
                    </p>
                    <p className="text-xs text-indigo-600 mt-1">
                      💳 UPI, Debit/Credit Cards, Net Banking
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PhonePe Payment Progress */}
            {phonePeStep > 0 && (
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-indigo-700">
                    {phonePeStep === 1 && 'Initiating PhonePe payment...'}
                    {phonePeStep === 2 && 'Connecting to payment gateway...'}
                    {phonePeStep === 3 && 'Processing payment...'}
                    {phonePeStep === 4 && 'Confirming transaction...'}
                  </span>
                </div>
                <div className="mt-2 bg-indigo-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(phonePeStep / 4) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Free Option */}
            {creditsRequired === 0 && (!course.price || course.price === 0) && (
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                  paymentMethod === 'free'
                    ? 'border-green-600 bg-green-50'
                    : 'border-green-300 bg-green-50 hover:border-green-400'
                }`}
                onClick={() => setPaymentMethod('free')}
              >
                <div className="flex items-start">
                  <input
                    type="radio"
                    name="payment"
                    value="free"
                    checked={paymentMethod === 'free'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-green-800">🎁 Free Course</p>
                    <p className="text-sm text-green-700">No payment required - Enroll instantly!</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              disabled={loading}
            >
              Cancel
            </button>

            {paymentMethod === 'credits' && (
              <button
                onClick={handleCreditPayment}
                disabled={(creditsRequired > 0 && !sufficientCredits) || loading}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                  (creditsRequired === 0 || sufficientCredits)
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
              >
                {loading ? 'Processing...' : creditsRequired > 0 ? `Pay ${creditsRequired} Credits` : 'Enroll Free'}
              </button>
            )}

            {paymentMethod === 'free' && (
              <button
                onClick={handleFreeEnrollment}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
              >
                {loading ? 'Enrolling...' : 'Enroll Now - Free'}
              </button>
            )}

            {paymentMethod === 'phonepe' && (
              <button
                onClick={handlePhonePePayment}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
              >
                {loading ? 'Processing...' : `Buy Now ₹${course.price || 1000}`}
              </button>
            )}
          </div>

          {/* Additional Info */}
          <p className="text-xs text-gray-500 mt-4 text-center">
            By enrolling, you agree to our terms and conditions.
          </p>
        </div>
      </div>
    </div>
  );
}
