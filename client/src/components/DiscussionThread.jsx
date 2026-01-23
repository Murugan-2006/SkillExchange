import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function DiscussionThread({ courseId }) {
  const [discussions, setDiscussions] = useState([]);
  const [newDiscussion, setNewDiscussion] = useState({ title: '', question: '' });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiscussions();
  }, [courseId]);

  const fetchDiscussions = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/discussions/${courseId}/discussions`
      );
      setDiscussions(response.data.discussions);
    } catch (error) {
      console.error('Error fetching discussions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      await axios.post(
        `${API_URL}/discussions/${courseId}/discussions`,
        newDiscussion,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setNewDiscussion({ title: '', question: '' });
      setShowForm(false);
      fetchDiscussions();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create discussion');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Discussion Threads</h2>

      {/* Create Discussion Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="mb-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        {showForm ? 'Cancel' : '+ Ask a Question'}
      </button>

      {/* Create Discussion Form */}
      {showForm && (
        <form onSubmit={handleCreateDiscussion} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Question title"
              value={newDiscussion.title}
              onChange={(e) =>
                setNewDiscussion({ ...newDiscussion, title: e.target.value })
              }
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="mb-4">
            <textarea
              placeholder="Describe your question"
              value={newDiscussion.question}
              onChange={(e) =>
                setNewDiscussion({ ...newDiscussion, question: e.target.value })
              }
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              rows="4"
            ></textarea>
          </div>
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Post Discussion
          </button>
        </form>
      )}

      {/* Discussions List */}
      {loading ? (
        <p className="text-gray-600">Loading discussions...</p>
      ) : discussions.length === 0 ? (
        <p className="text-gray-600 text-center py-8">No discussions yet. Be first to ask!</p>
      ) : (
        <div className="space-y-4">
          {discussions.map((discussion) => (
            <div key={discussion._id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {discussion.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    by {discussion.student?.name} • {discussion.views} views
                  </p>
                </div>
                <span className="text-sm font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded">
                  {discussion.replies?.length || 0} replies
                </span>
              </div>
              <p className="text-gray-700 mb-3">{discussion.question}</p>
              <div className="flex gap-4 text-sm">
                <button className="text-blue-600 hover:text-blue-700">👍 {discussion.upvotes}</button>
                <button className="text-blue-600 hover:text-blue-700">💬 Reply</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
