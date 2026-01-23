import React, { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ProjectSubmission({ courseId, isVisible = true }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectUrl: '',
    gitHubLink: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [urlType, setUrlType] = useState('github'); // 'github', 'demo', or 'both'

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that at least one URL is provided
    if (!formData.projectUrl && !formData.gitHubLink) {
      alert('Please provide at least one URL (Project Demo or GitHub Repository)');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      await axios.post(
        `${API_URL}/projects/${courseId}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(true);
      setFormData({ title: '', description: '', projectUrl: '', gitHubLink: '' });

      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit project');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-8">
      <div className="flex items-center mb-6">
        <span className="text-2xl mr-3">📝</span>
        <h2 className="text-2xl font-bold text-gray-800">Submit Your Project</h2>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-700">
          ✓ Project submitted successfully! Awaiting instructor review.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g., E-commerce Platform"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Describe your project, features, and technologies used..."
            rows="4"
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project URLs
          </label>
          
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">
              <input
                type="checkbox"
                checked={urlType.includes('demo')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setUrlType(urlType.includes('github') ? 'both' : 'demo');
                  } else {
                    setUrlType(urlType === 'both' ? 'github' : 'demo');
                  }
                }}
                className="mr-2"
              />
              Live Demo / Project URL
            </label>
            <input
              type="url"
              name="projectUrl"
              value={formData.projectUrl}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="https://your-project-demo.com"
            />
            <p className="text-xs text-gray-500 mt-1">e.g., deployed website, live app, or hosted project</p>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">
              <input
                type="checkbox"
                checked={urlType.includes('github')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setUrlType(urlType.includes('demo') ? 'both' : 'github');
                  } else {
                    setUrlType(urlType === 'both' ? 'demo' : 'github');
                  }
                }}
                className="mr-2"
              />
              GitHub Repository Link
            </label>
            <input
              type="url"
              name="gitHubLink"
              value={formData.gitHubLink}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="https://github.com/username/repo"
            />
            <p className="text-xs text-gray-500 mt-1">Source code repository</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition"
        >
          {loading ? 'Submitting...' : 'Submit Project'}
        </button>
      </form>

      <p className="text-xs text-gray-600 mt-4">
        * Your project will be reviewed by an instructor. You'll receive a certificate upon approval.
      </p>
    </div>
  );
}
