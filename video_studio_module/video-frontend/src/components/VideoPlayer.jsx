import { useState, useRef, useEffect } from 'react';
import { getVideoStreamUrl } from '../api/video';

const VideoPlayer = ({ videoId, title, onClose }) => {
  const [videoSrc, setVideoSrc] = useState(null); // Use local state for video source

  const videoRef = useRef(null);

  useEffect(() => {
    // Construct the video URL and set it in local state
    const url = getVideoStreamUrl(videoId);
    console.log("Generated Video URL:", url);
    setVideoSrc(url);
    
    // Auto-scroll to video player when it opens with increased range
    setTimeout(() => {
      const videoPlayer = document.querySelector('.video-player-container');
      if (videoPlayer) {
        videoPlayer.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
        // Additional scroll offset for better positioning
        setTimeout(() => {
          window.scrollBy(0, -100); // Scroll up 100px for better view
        }, 500);
      }
    }, 100);
  }, [videoId]); // Update when videoId changes

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 video-player-container">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title || 'Video'}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="relative">
          {videoSrc ? (
            <video
              ref={videoRef}
              className="w-full rounded-lg"
              src={videoSrc}
              type="video/mp4"
              controls // Add controls for testing
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <p>Loading video...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;