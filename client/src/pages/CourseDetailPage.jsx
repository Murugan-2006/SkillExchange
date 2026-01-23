import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService, videoService } from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import ProjectSubmission from '../components/ProjectSubmission';

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProjectForm, setShowProjectForm] = useState(false);

  useEffect(() => {
    fetchCourseAndVideos();
  }, [courseId]);

  const fetchCourseAndVideos = async () => {
    try {
      setLoading(true);
      const courseRes = await courseService.getCourseById(courseId);
      setCourse(courseRes.data.course);

      const videosRes = await videoService.getVideosByCourse(courseId);
      setVideos(videosRes.data.videos);
      
      if (videosRes.data.videos.length > 0) {
        setSelectedVideo(videosRes.data.videos[0]);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      alert('Failed to load course');
      navigate('/student/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Course not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{course.title}</h1>
          <p className="text-gray-600">{course.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video Player - Takes more space */}
          <div className="lg:col-span-3">
            {selectedVideo ? (
              <div>
                <VideoPlayer 
                  videoId={selectedVideo._id} 
                  courseId={courseId}
                  onVideoComplete={() => setShowProjectForm(true)}
                />
                
                {/* Project Submission Form */}
                {showProjectForm && (
                  <ProjectSubmission courseId={courseId} isVisible={true} />
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600">No videos available for this course</p>
              </div>
            )}
          </div>

          {/* Sidebar - Video List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Course Content</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {videos.length === 0 ? (
                  <p className="text-gray-600 text-sm">No videos in this course yet</p>
                ) : (
                  videos.map((video) => (
                    <button
                      key={video._id}
                      onClick={() => setSelectedVideo(video)}
                      className={`w-full text-left p-3 rounded-lg transition ${
                        selectedVideo?._id === video._id
                          ? 'bg-blue-100 border-l-4 border-blue-600 text-blue-900'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="font-semibold text-sm">{video.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {video.views} views
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Course Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>Level:</strong> <br/>{course.level}</p>
                  <p><strong>Category:</strong> <br/>{course.category}</p>
                  {course.creditsEarned > 0 && (
                    <p><strong>Credits:</strong> <br/>{course.creditsEarned}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
