import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function FeedbackForm({ courseId, onFeedbackSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState(null);

  // Check if feedback already submitted
  useEffect(() => {
    const checkExistingFeedback = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await axios.get(`${API_URL}/feedback/check/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.data.hasSubmitted) {
          setAlreadySubmitted(true);
          setExistingFeedback(res.data.feedback);
          onFeedbackSubmitted?.(true);
        }
      } catch (err) {
        console.error('Failed to check feedback status:', err);
      }
    };

    checkExistingFeedback();
  }, [courseId, onFeedbackSubmitted]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a star rating');
      return;
    }

    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');

    try {
      const res = await axios.post(
        `${API_URL}/feedback/${courseId}`,
        { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(true);
      setAlreadySubmitted(true);
      setExistingFeedback({ rating, comment });
      onFeedbackSubmitted?.(true);

      // Clear form
      setComment('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (interactive = true) => {
    const stars = [];
    const displayRating = interactive ? (hoveredRating || rating) : (existingFeedback?.rating || 0);

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          disabled={!interactive || alreadySubmitted}
          onClick={() => interactive && setRating(i)}
          onMouseEnter={() => interactive && setHoveredRating(i)}
          onMouseLeave={() => interactive && setHoveredRating(0)}
          className={`text-3xl transition-transform ${
            interactive && !alreadySubmitted ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
          }`}
        >
          {i <= displayRating ? (
            <span className="text-yellow-400">★</span>
          ) : (
            <span className="text-gray-300">★</span>
          )}
        </button>
      );
    }

    return stars;
  };

  // Already submitted view
  if (alreadySubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">✅</span>
          <h3 className="text-lg font-semibold text-green-800">Thank you for your feedback!</h3>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-gray-700">Your rating:</span>
          <div className="flex">{renderStars(false)}</div>
        </div>
        {existingFeedback?.comment && (
          <p className="text-gray-600 italic mt-2">"{existingFeedback.comment}"</p>
        )}
        <p className="text-sm text-green-700 mt-3">
          🎉 Credits have been added to the instructor's wallet based on your rating!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">⭐</span>
        <h3 className="text-xl font-bold text-gray-800">Rate This Course</h3>
        <span className="text-red-500 text-sm font-medium">(Required before project submission)</span>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          ✓ Feedback submitted successfully! You can now submit your project.
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How would you rate this course? *
          </label>
          <div className="flex items-center gap-1">
            {renderStars(true)}
            {rating > 0 && (
              <span className="ml-3 text-gray-600 text-sm">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Comments (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            placeholder="Share your experience with this course..."
            rows="3"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || rating === 0}
          className={`w-full py-3 rounded-lg font-semibold transition ${
            rating === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-yellow-500 hover:bg-yellow-600 text-white'
          }`}
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>

      <p className="text-xs text-gray-500 mt-3">
        * Your feedback helps instructors improve their courses and earns them credits based on your rating.
      </p>
    </div>
  );
}
