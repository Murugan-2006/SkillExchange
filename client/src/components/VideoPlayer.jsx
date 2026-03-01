import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function VideoPlayer({ videoId, courseId, onVideoComplete }) {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isVideoFinished, setIsVideoFinished] = useState(false);

  const videoRef = useRef(null);
  const lastTimeRef = useRef(0);
  const maxWatchedTimeRef = useRef(0); // Track the furthest point watched
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    fetchVideo();
  }, [videoId]);

  // Pause video when the tab becomes hidden or the window loses focus
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    };

    const handleBlur = () => {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const fetchVideo = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching video:', videoId);
      const response = await axios.get(`${API_URL}/videos/${videoId}`);
      console.log('Video response:', response.data);
      setVideo(response.data.video);

      // apply current playback rate to loaded video
      setTimeout(() => {
        if (videoRef.current) videoRef.current.playbackRate = playbackRate;
      }, 0);
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

    // store last known time for seeking control
    lastTimeRef.current = currentTime;
    
    // Update max watched time - track the furthest point user has watched
    if (currentTime > maxWatchedTimeRef.current) {
      maxWatchedTimeRef.current = currentTime;
    }

    // Mark video as finished when 90% watched
    if (newProgress >= 90 && !isVideoFinished) {
      setIsVideoFinished(true);
      if (onVideoComplete) {
        onVideoComplete();
      }
    }

    // Update enrollment progress using courseId
    const token = localStorage.getItem('token');
    if (courseId) {
      axios
        .put(
          `${API_URL}/enrollments/course/${courseId}/progress`,
          { videoId, watchPercentage: newProgress },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        .catch((err) => console.error('Error updating progress:', err));
    }
  };

  // Handle seeking - allow backward, block forward (unless video is finished)
  const handleSeeking = (e) => {
    const video = videoRef.current;
    if (!video) return;

    const seekTime = video.currentTime;
    
    // If video is finished (90%+ watched), allow seeking anywhere
    if (isVideoFinished) {
      return; // Allow the seek
    }

    // Allow seeking backward (to any previously watched position)
    if (seekTime <= maxWatchedTimeRef.current) {
      return; // Allow the seek
    }

    // Block seeking forward beyond max watched time
    // Reset to the max watched position
    video.currentTime = maxWatchedTimeRef.current;
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

  // Playback controls handlers
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const changePlaybackRate = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) videoRef.current.playbackRate = rate;
  };

  const toggleFullscreen = () => {
    const container = videoRef.current?.closest('.relative') || videoRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // Seek backward by 10 seconds (always allowed)
  const seekBackward = () => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, videoRef.current.currentTime - 10);
    videoRef.current.currentTime = newTime;
  };

  // Seek forward by 10 seconds (only if within watched range or video is finished)
  const seekForward = () => {
    if (!videoRef.current) return;
    const newTime = videoRef.current.currentTime + 10;
    
    // Allow if video is finished OR if seeking within already watched portion
    if (isVideoFinished || newTime <= maxWatchedTimeRef.current) {
      videoRef.current.currentTime = Math.min(newTime, videoRef.current.duration);
    } else {
      // Otherwise, jump to max watched time
      videoRef.current.currentTime = maxWatchedTimeRef.current;
    }
  };


  return (
    <div className="w-full">
      <div className="bg-black rounded-lg overflow-hidden w-full">
        <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
          <video
            ref={videoRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
            // Remove native controls to hide download/seek/time UI
            controls={false}
            onTimeUpdate={(e) => {
              handleProgressUpdate(e.target.currentTime, e.target.duration);
              lastTimeRef.current = e.target.currentTime;
            }}
            onSeeking={handleSeeking}
            onContextMenu={(e) => e.preventDefault()} // disable right-click download
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          >
            <source src={video.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Custom controls: play/pause, seek, speed, fullscreen */}
          <div className="absolute left-4 bottom-4 flex items-center gap-3 bg-black bg-opacity-50 p-2 rounded">
            {/* Seek backward - always enabled */}
            <button
              onClick={seekBackward}
              className="text-white px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
              title="Rewind 10 seconds"
            >
              -10s
            </button>

            <button
              onClick={() => togglePlay()}
              className="text-white px-3 py-1 rounded bg-gray-800 hover:bg-gray-700"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            {/* Seek forward - shows different style based on availability */}
            <button
              onClick={seekForward}
              className={`text-white px-2 py-1 rounded ${
                isVideoFinished 
                  ? 'bg-gray-800 hover:bg-gray-700' 
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
              title={isVideoFinished ? "Forward 10 seconds" : "Forward 10s (limited to watched portion)"}
            >
              +10s
            </button>

            <label className="text-white text-sm flex items-center gap-2">
              Speed
              <select
                value={playbackRate}
                onChange={(e) => changePlaybackRate(Number(e.target.value))}
                className="ml-1 bg-gray-800 text-white text-sm p-1 rounded"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
            </label>


            <button
              onClick={() => toggleFullscreen()}
              className="text-white px-3 py-1 rounded bg-gray-800 hover:bg-gray-700"
            >
              Fullscreen
            </button>
          </div>
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
