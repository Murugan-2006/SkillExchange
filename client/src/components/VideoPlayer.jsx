import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function VideoPlayer({ videoId, courseId, onVideoComplete }) {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isVideoFinished, setIsVideoFinished] = useState(false);

  useEffect(() => {
    fetchVideo();
  }, [videoId]);

  const fetchVideo = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching video:', videoId);
      const response = await axios.get(`${API_URL}/videos/${videoId}`);
      console.log('Video response:', response.data);
      setVideo(response.data.video);
    } catch (error) {
      console.error('Error fetching video:', error);
      setError(error.response?.data?.message || 'Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdate = (currentTime, duration) => {
    const newProgress = (currentTime / duration) * 100;
    setProgress(newProgress);

    // Mark video as finished when 90% watched
    if (newProgress >= 90 && !isVideoFinished) {
      setIsVideoFinished(true);
      if (onVideoComplete) {
        onVideoComplete();
      }
    }

    // Update enrollment progress
    const token = localStorage.getItem('token');
    axios
      .put(
        `${API_URL}/enrollments`,
        { videoId, watchPercentage: newProgress },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .catch((err) => console.error('Error updating progress:', err));
  };

  if (loading) {
    return (
      <div className="bg-black rounded-lg overflow-hidden w-full aspect-video flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-lg">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="bg-gray-900 rounded-lg overflow-hidden w-full aspect-video flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-lg">Video not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-black rounded-lg overflow-hidden w-full">
        <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
          <video
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
            controls
            onTimeUpdate={(e) =>
              handleProgressUpdate(e.target.currentTime, e.target.duration)
            }
          >
            <source src={video.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      <div className="bg-gray-900 text-white p-6 rounded-b-lg">
        <h2 className="text-2xl font-bold mb-2">{video.title}</h2>
        <p className="text-gray-400 mb-4">{video.description}</p>

        <div className="flex justify-between items-center text-sm mb-4">
          <span>{video.views} views</span>
          <div className="bg-gray-700 rounded-full h-2 w-48">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Video Completion Message */}
        {isVideoFinished && (
          <div className="bg-green-500 bg-opacity-20 border border-green-400 text-green-100 p-3 rounded-lg mt-4">
            ✓ Great! You've watched this video. You can now submit your project.
          </div>
        )}
      </div>
    </div>
  );
}
