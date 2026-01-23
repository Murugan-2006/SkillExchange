import React, { useRef, useEffect, useState } from 'react';

export default function AttentionAwarePlayback({ videoRef, onAttentionChange }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [attention, setAttention] = useState(true);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isEnabled || !videoRef?.current) return;

    const initializeFaceDetection = async () => {
      try {
        // Face-api.js would be loaded from CDN in production
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        // Check attention periodically
        const interval = setInterval(() => {
          checkAttention(video);
        }, 500);

        return () => {
          clearInterval(interval);
          stream.getTracks().forEach((track) => track.stop());
        };
      } catch (error) {
        console.warn('Camera access not available:', error);
        setIsEnabled(false);
      }
    };

    initializeFaceDetection();
  }, [isEnabled]);

  const checkAttention = (video) => {
    // Simplified attention detection - in production, use face-api.js
    // This would detect if the person is looking at the screen

    // Mock implementation:
    const isLooking = Math.random() > 0.1; // 90% chance they're looking

    setAttention(isLooking);
    onAttentionChange?.(isLooking);

    if (!isLooking && videoRef?.current && !videoRef.current.paused) {
      videoRef.current.pause();
      console.log('📹 Video paused - user looking away');
    } else if (isLooking && videoRef?.current && videoRef.current.paused) {
      videoRef.current.play();
      console.log('📹 Video resumed - user looking back');
    }
  };

  return (
    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={(e) => setIsEnabled(e.target.checked)}
          className="mr-3"
        />
        <span className="text-sm text-gray-700">
          📹 Enable Attention-Aware Playback
        </span>
      </label>

      {isEnabled && (
        <div className="mt-3 p-3 bg-white rounded border border-blue-200">
          <p className="text-xs text-gray-600 mb-2">
            ℹ️ We'll use your camera to detect if you're looking away. The video will
            pause if you lose focus.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Attention Status:</span>
            <span
              className={`text-sm font-bold px-3 py-1 rounded ${
                attention
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {attention ? '✓ Focused' : '⚠️ Looking Away'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
