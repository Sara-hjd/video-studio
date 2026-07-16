import React, { useState, useEffect, useRef } from 'react';
import VideoTimeline from './VideoTimeline';

const VideoEditor = ({ video, onSave, onCancel }) => {
  const [videoInfo, setVideoInfo] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [validation, setValidation] = useState(null);
  
  const videoRef = useRef(null);
  const API_BASE_URL = 'https://192.168.1.168/api/videos';

  useEffect(() => {
    console.log('VideoEditor mounted with video:', video);
    if (video && video.id) {
      fetchVideoInfo();
    }
  }, [video]);

  useEffect(() => {
    if (videoInfo) {
      setEndTime(videoInfo.duration);
      validateTrim();
    }
  }, [startTime, endTime, videoInfo]);

  const fetchVideoInfo = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/${video.id}/video_info/`);
      
      if (response.ok) {
        const data = await response.json();
        setVideoInfo(data.video_info);
        setVideoUrl(data.video_url);
        setStartTime(0);
        setEndTime(data.video_info.duration);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error loading video information');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const validateTrim = async () => {
    if (!videoInfo || startTime === null || endTime === null) return;

    try {
      const response = await fetch(`${API_BASE_URL}/${video.id}/validate_trim/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_time: startTime,
          end_time: endTime
        })
      });

      if (response.ok) {
        const data = await response.json();
        setValidation(data);
      }
    } catch (err) {
      console.error('Erreur de validation:', err);
    }
  };

  const handleTrim = async () => {
    if (!validation || !validation.valid) return;

    try {
      setIsProcessing(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/${video.id}/trim_video/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_time: startTime,
          end_time: endTime
        })
      });

      if (response.ok) {
        const data = await response.json();
        onSave(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error during editing');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading video information...</span>
      </div>
    );
  }

  if (!videoInfo) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
        <p className="text-red-600">{error || 'Unable to load video information'}</p>
        <button 
          onClick={onCancel}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg video-editor-container">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">✂️ Video Editing</h2>
        <button 
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ✕
        </button>
      </div>

      {/* Video Information */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Video Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Duration:</span>
            <div className="font-semibold">{formatTime(videoInfo.duration)}</div>
          </div>
          <div>
            <span className="text-gray-600">Resolution:</span>
            <div className="font-semibold">{videoInfo.width}×{videoInfo.height}</div>
          </div>
          <div>
            <span className="text-gray-600">Audio:</span>
            <div className="font-semibold">{videoInfo.has_audio ? 'Yes' : 'No'}</div>
          </div>
          <div>
            <span className="text-gray-600">Size:</span>
            <div className="font-semibold">{(videoInfo.size / 1024 / 1024).toFixed(1)} MB</div>
          </div>
        </div>
        
        {/* FFmpeg Notice */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-yellow-600 mr-2">⚠️</span>
            <div className="text-sm text-yellow-800">
              <strong>Note:</strong> Video editing is currently in simulation mode. 
              Actual video trimming requires FFmpeg to be installed on the server.
            </div>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="mb-6">
        <video
          ref={videoRef}
          src={videoUrl || video.video}
          controls
          className="w-full rounded-lg shadow-md"
          style={{ maxHeight: '400px' }}
        >
          Your browser does not support video playback.
        </video>
      </div>

      {/* Video Timeline */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Trim Video</h3>
        <VideoTimeline
          videoRef={videoRef}
          duration={videoInfo.duration}
          onTrimChange={(trimData) => {
            setStartTime(trimData.startTime);
            setEndTime(trimData.endTime);
          }}
          onSeek={(time) => {
            if (videoRef.current) {
              videoRef.current.currentTime = time;
            }
          }}
          width="100%"
          height={120}
        />
        
        {/* Trim Summary - Only show errors */}
        {validation && !validation.valid && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-red-800">
                  Invalid trim settings
                </span>
              </div>
              <div className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                ✗ Invalid
              </div>
            </div>
            <p className="text-red-600 text-sm mt-1">{validation.error}</p>
          </div>
        )}
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button
          onClick={handleTrim}
          disabled={!validation?.valid || isProcessing}
          className={`px-6 py-2 rounded-lg font-medium ${
            validation?.valid && !isProcessing
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Editing in progress...
            </div>
          ) : (
            '✂️ Cut video'
          )}
        </button>
      </div>
    </div>
  );
};

export default VideoEditor;
