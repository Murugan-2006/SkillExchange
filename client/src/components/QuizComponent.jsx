import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function QuizComponent({ videoId }) {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuiz();
  }, [videoId]);

  const fetchQuiz = async () => {
    try {
      const response = await axios.get(`${API_URL}/quizzes/${videoId}`);
      setQuiz(response.data.quiz);
      setAnswers(new Array(response.data.quiz?.questions?.length || 0).fill(''));
    } catch (error) {
      console.error('Error fetching quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleSubmitQuiz = async () => {
    const token = localStorage.getItem('token');

    try {
      const response = await axios.post(
        `${API_URL}/quizzes/${quiz._id}/submit`,
        { answers },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setResult(response.data);
      setSubmitted(true);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit quiz');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading quiz...</div>;
  }

  if (!quiz || quiz.questions.length === 0) {
    return <div className="text-center py-12">No quiz available for this video</div>;
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Quiz Completed!</h2>
          <p className="text-4xl font-bold text-green-600">{result?.score?.toFixed(1)}%</p>
          <p className="text-gray-600">Great job! You scored {result?.score?.toFixed(1)}%</p>
        </div>

        <div className="space-y-4">
          {result?.feedback?.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg ${
                item.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}
            >
              <p className="font-semibold text-gray-800 mb-2">
                {idx + 1}. {quiz.questions[idx].question}
              </p>
              <p className={item.isCorrect ? 'text-green-700' : 'text-red-700'}>
                {item.isCorrect ? '✓ Correct' : '✗ Incorrect'}
              </p>
              <p className="text-sm text-gray-600 mt-2">{item.explanation}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Course Quiz</h2>

      <div className="space-y-6">
        {quiz.questions.map((question, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">
              {idx + 1}. {question.question}
            </h3>

            {question.type === 'mcq' ? (
              <div className="space-y-2">
                {question.options.map((option, optIdx) => (
                  <label key={optIdx} className="flex items-center">
                    <input
                      type="radio"
                      name={`question-${idx}`}
                      value={option}
                      checked={answers[idx] === option}
                      onChange={(e) => handleAnswerChange(idx, e.target.value)}
                      className="mr-3"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                value={answers[idx]}
                onChange={(e) => handleAnswerChange(idx, e.target.value)}
                placeholder="Write your answer here..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                rows="3"
              ></textarea>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmitQuiz}
        className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
      >
        Submit Quiz
      </button>
    </div>
  );
}
