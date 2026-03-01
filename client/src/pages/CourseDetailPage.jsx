import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService, videoService, notesService } from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import ProjectSubmission from '../components/ProjectSubmission';
import FeedbackForm from '../components/FeedbackForm';

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [debugError, setDebugError] = useState(null);

  useEffect(() => {
    fetchCourseAndVideos();
  }, [courseId]);

  const fetchCourseAndVideos = async () => {
    try {
      setLoading(true);
      setDebugError(null);

      console.log('Fetching course by id:', courseId);
      const courseRes = await courseService.getCourseById(courseId);
      console.log('Course response:', courseRes.data);
      setCourse(courseRes.data.course);

      console.log('Fetching videos for course:', courseId);
      const videosRes = await videoService.getVideosByCourse(courseId);
      console.log('Videos response:', videosRes.data);
      setVideos(videosRes.data.videos);
      
      // Fetch notes for the course
      try {
        const notesRes = await notesService.getNotesByCourse(courseId);
        console.log('Notes response:', notesRes.data);
        setNotes(notesRes.data.notes || []);
      } catch (notesError) {
        console.error('Error fetching notes:', notesError);
        setNotes([]);
      }
      
      if (videosRes.data.videos.length > 0) {
        setSelectedVideo(videosRes.data.videos[0]);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      const message = error.response?.data?.message || error.message || 'Failed to load course';
      setDebugError({ message, details: error.response?.data || error });
      // Do not redirect automatically - show debug info on the page
      // navigate('/student/dashboard');
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
          {debugError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-600 text-sm text-left max-w-xl mx-auto">
              <strong>Debug:</strong>
              <div className="mt-2">{debugError.message}</div>
              <pre className="mt-2 text-xs text-gray-700 bg-white p-2 rounded overflow-auto">{JSON.stringify(debugError.details, null, 2)}</pre>
            </div>
          )}
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
                  <div>
                    {/* Feedback Form - Required before project submission */}
                    <FeedbackForm 
                      courseId={courseId} 
                      onFeedbackSubmitted={(submitted) => setFeedbackSubmitted(submitted)} 
                    />
                    
                    {/* Project Submission - Enabled only after feedback */}
                    <ProjectSubmission 
                      courseId={courseId} 
                      isVisible={true} 
                      feedbackSubmitted={feedbackSubmitted}
                    />
                  </div>
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

              {/* Course Notes/Documents */}
              {notes.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">📄 Course Notes</h3>
                  <div className="space-y-2">
                    {notes.map((note) => (
                      <a
                        key={note._id}
                        href={note.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-600 text-xl">📑</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-indigo-900 text-sm truncate">{note.title}</p>
                            {note.description && (
                              <p className="text-xs text-gray-500 truncate">{note.description}</p>
                            )}
                          </div>
                          <span className="text-indigo-600 text-sm">↗</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
