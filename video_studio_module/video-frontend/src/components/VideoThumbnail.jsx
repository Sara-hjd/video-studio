import React, { useState, useEffect, useRef } from 'react';

const VideoThumbnail = ({ video, onDurationExtracted, onPlayClick }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [duration, setDuration] = useState('--:--');
  const [isLoading, setIsLoading] = useState(true);
  
  const videoRef = useRef(null);

  useEffect(() => {
    if (video && video.video) {
      // Convert relative URL to absolute URL
      const videoUrl = video.video.startsWith('http') 
        ? video.video 
        : `https://192.168.1.168${video.video}`;
      
      // Wait for the video element to be rendered
      const timer = setTimeout(() => {
        if (videoRef.current) {
          generateThumbnail(videoUrl);
        } else {
          // Retry after a short delay
          setTimeout(() => {
            if (videoRef.current) {
              generateThumbnail(videoUrl);
            } else {
              setIsLoading(false);
            }
          }, 100);
        }
      }, 50);
      
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [video.id, video.video]);

  const generateThumbnail = (videoUrl) => {
    if (!videoRef.current || !videoUrl) {
      setIsLoading(false);
      return;
    }
    
    const videoElement = videoRef.current;
    setIsLoading(true);
    setThumbnailUrl(null);
    
    // Add timeout fallback
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setThumbnailUrl(null);
    }, 10000); // 10 second timeout
    
    // Simple approach: load video and capture frame
    const handleCanPlay = () => {
      try {
        // Seek to 2 seconds or 25% of video for better frames
        const seekTime = Math.min(2, videoElement.duration * 0.25);
        videoElement.currentTime = seekTime;
        
        // Extract duration
        if (videoElement.duration && !isNaN(videoElement.duration) && isFinite(videoElement.duration)) {
          const actualDuration = formatDuration(videoElement.duration);
          console.log('VideoThumbnail: Extracted duration for video', video.id, ':', actualDuration, 'seconds:', videoElement.duration);
          setDuration(actualDuration);
          onDurationExtracted?.(video.id, actualDuration);
        } else {
          console.log('VideoThumbnail: No valid duration found for video', video.id, 'duration:', videoElement.duration);
        }
      } catch (err) {
      }
    };
    
    const handleSeeked = () => {
      try {
        // Create canvas and draw video frame
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to video size
        canvas.width = videoElement.videoWidth || 320;
        canvas.height = videoElement.videoHeight || 240;
        
        // Draw the current video frame
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        // Force state update with setTimeout to ensure React processes it
        setTimeout(() => {
          setThumbnailUrl(thumbnailDataUrl);
          setIsLoading(false);
        }, 100);
        
        clearTimeout(timeoutId);
        
        // Clean up
        videoElement.removeEventListener('canplay', handleCanPlay);
        videoElement.removeEventListener('seeked', handleSeeked);
      } catch (err) {
        setThumbnailUrl(null);
        setIsLoading(false);
        clearTimeout(timeoutId);
      }
    };
    
    const handleError = (e) => {
      setThumbnailUrl(null);
      setIsLoading(false);
      clearTimeout(timeoutId);
    };
    
    // Add event listeners
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('seeked', handleSeeked);
    videoElement.addEventListener('error', handleError);
    videoElement.addEventListener('loadstart', () => {});
    videoElement.addEventListener('loadeddata', () => {});
    videoElement.addEventListener('loadedmetadata', () => {});
    
    // Set video source
    videoElement.src = videoUrl;
    videoElement.crossOrigin = 'anonymous';
    videoElement.load();
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '--:--';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlayClick = () => {
    onPlayClick?.(video);
  };



  return (
    <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center relative group overflow-hidden">
      
      {/* Hidden video element for thumbnail generation - always render this */}
      <video
        ref={videoRef}
        muted
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
        style={{ display: 'none' }}
      />
      
      {isLoading ? (
        <div className="flex flex-col items-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <span className="text-sm text-gray-600">Loading thumbnail...</span>
        </div>
      ) : thumbnailUrl ? (
        <div>
          <img
            src={thumbnailUrl}
            alt="Video thumbnail"
            className="w-full h-full object-cover rounded-lg"
          />
          <div className="absolute top-0 left-0 bg-green-500 text-white text-xs p-1">Video {video.id} - HAS THUMBNAIL</div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <span className="text-4xl mb-2">🎥</span>
          <span className="text-sm text-gray-600">No thumbnail</span>
          <div className="text-xs text-red-500 mt-1">Video {video.id} - NO THUMBNAIL</div>
        </div>
      )}
      
      {/* Play Button Overlay */}
      <div className="absolute inset-0 bg-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
        <button
          onClick={handlePlayClick}
          className="bg-white bg-opacity-90 hover:bg-opacity-100 text-black rounded-full p-3 transition-all duration-200 transform hover:scale-110"
        >
          ▶️
        </button>
      </div>
      
      {/* Duration Badge */}
      {duration !== '--:--' && (
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-medium">
          {duration}
        </div>
      )}
    </div>
  );
};

export default VideoThumbnail;