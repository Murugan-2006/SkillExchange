import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseService, videoService } from '../services/api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [courseVideos, setCourseVideos] = useState({});
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    skillsCovered: [],
    level: 'beginner',
    project:'upload the project in link format',
  });
  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    videoFile: null,
    videoOrder: 1,
    transcript: '',
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await courseService.getAllCourses();
      setCourses(response.data.courses);
      
      // Fetch videos for all courses
      response.data.courses.forEach(async (course) => {
        try {
          const videosRes = await videoService.getVideosByCourse(course._id);
          setCourseVideos(prev => ({
            ...prev,
            [course._id]: videosRes.data.videos
          }));
        } catch (error) {
          console.error('Error fetching videos for course:', error);
        }
      });
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await courseService.createCourse(newCourse);
      alert('Course created successfully!');
      setNewCourse({
        title: '',
        description: '',
        skillsCovered: [],
        level: 'beginner',
      });
      setShowCreateForm(false);
      fetchCourses();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create course');
    }
  };

  const handleVideoUpload = async (e) => {
    e.preventDefault();
    if (!selectedCourse || !newVideo.title || !newVideo.videoFile) {
      alert('Please fill in all required fields and select a video file');
      return;
    }

    setVideoUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', newVideo.title);
      formData.append('description', newVideo.description);
      formData.append('videoOrder', newVideo.videoOrder);
      formData.append('transcript', newVideo.transcript);
      formData.append('file', newVideo.videoFile);

      await videoService.uploadVideo(selectedCourse, formData);
      alert('Video uploaded successfully!');
      setNewVideo({
        title: '',
        description: '',
        videoFile: null,
        videoOrder: 1,
        transcript: '',
      });
      setShowVideoForm(false);
      fetchCourses();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to upload video');
    } finally {
      setVideoUploading(false);
    }
  };

  const handleDeleteVideo = async (videoId, videoTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${videoTitle}"?`)) {
      return;
    }

    try {
      await videoService.deleteVideo(videoId);
      alert('Video deleted successfully!');
      fetchCourses();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete video');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Admin Dashboard 
          </h1>
          <p className="text-gray-600">Manage courses and monitor platform</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Total Courses</h3>
            <p className="text-3xl font-bold text-blue-600">{courses.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Total Enrollments</h3>
            <p className="text-3xl font-bold text-green-600">
              {courses.reduce((sum, c) => sum + c.enrollmentCount, 0)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Active Courses</h3>
            <p className="text-3xl font-bold text-purple-600">
              {courses.filter((c) => c.isActive).length}
            </p>
          </div>
        </div>

        <div className="mb-8 flex gap-4">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {showCreateForm ? 'Cancel' : '+ Create Course'}
          </button>
          <button
            onClick={() => navigate('/courses')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            📚 Explore & Enroll Courses
          </button>
        </div>
        {/* Create Course Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Create New Course</h2>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Title
                </label>
                <input
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, description: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows="4"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level
                </label>
                <select
                  value={newCourse.level}
                  onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Create Course
              </button>
            </form>
          </div>
        )}

        {/* Video Upload Form */}
        {showVideoForm && selectedCourse && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Upload Video to Course</h2>
            <form onSubmit={handleVideoUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Video Title
                </label>
                <input
                  type="text"
                  value={newVideo.title}
                  onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter video title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newVideo.description}
                  onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows="3"
                  placeholder="Enter video description"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Video File *
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setNewVideo({ ...newVideo, videoFile: e.target.files[0] })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {newVideo.videoFile && (
                  <p className="text-sm text-green-600 mt-1">
                    Selected: {newVideo.videoFile.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Video Order
                </label>
                <input
                  type="number"
                  value={newVideo.videoOrder}
                  onChange={(e) => setNewVideo({ ...newVideo, videoOrder: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transcript (Optional)
                </label>
                <textarea
                  value={newVideo.transcript}
                  onChange={(e) => setNewVideo({ ...newVideo, transcript: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows="3"
                  placeholder="Enter video transcript"
                ></textarea>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={videoUploading}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
                >
                  {videoUploading ? 'Uploading...' : 'Upload Video'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowVideoForm(false);
                    setSelectedCourse(null);
                    setNewVideo({
                      title: '',
                      description: '',
                      videoFile: null,
                      videoOrder: 1,
                      transcript: '',
                    });
                  }}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Courses List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">My Courses</h2>

          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : courses.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No courses created yet</p>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => (
                <div key={course._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {course.title}
                      </h3>
                      <p className="text-gray-600 text-sm">{course.description}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Videos: {courseVideos[course._id]?.length || 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-600">
                        {course.enrollmentCount} enrollments
                      </p>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          course.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {course.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <div className="mt-2 space-y-2">
                        <button
                          onClick={() => setExpandedCourse(expandedCourse === course._id ? null : course._id)}
                          className="block w-full bg-purple-600 text-white px-4 py-1 rounded text-sm hover:bg-purple-700 transition"
                        >
                          {expandedCourse === course._id ? '▼ Hide Videos' : '▶ View Videos'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCourse(course._id);
                            setShowVideoForm(true);
                          }}
                          className="block w-full bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700 transition"
                        >
                          + Upload Video
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Videos List */}
                  {expandedCourse === course._id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {courseVideos[course._id] && courseVideos[course._id].length > 0 ? (
                        <div className="space-y-2">
                          {courseVideos[course._id].map((video) => (
                            <div key={video._id} className="bg-gray-50 p-3 rounded flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-800">{video.title}</p>
                                <p className="text-sm text-gray-600">{video.description}</p>
                                <p className="text-xs text-gray-500 mt-1">{video.views} views</p>
                              </div>
                              <button
                                onClick={() => handleDeleteVideo(video._id, video.title)}
                                className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition whitespace-nowrap"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600 text-sm">No videos uploaded yet</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
