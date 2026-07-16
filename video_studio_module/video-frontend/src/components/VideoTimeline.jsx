import React, { useState, useEffect, useRef, useCallback } from 'react';

const VideoTimeline = ({ 
  videoRef, 
  duration = 0, 
  onTrimChange, 
  onSeek,
  width = '100%',
  height = 120 
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [actualDuration, setActualDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null); // 'playhead', 'start', 'end'
  const [isHovering, setIsHovering] = useState(false);
  const [hoverType, setHoverType] = useState(null);
  
  const timelineRef = useRef(null);
  const videoElement = videoRef?.current;

  // Get actual video duration
  useEffect(() => {
    if (videoElement) {
      const updateDuration = () => {
        if (videoElement.duration && !isNaN(videoElement.duration) && isFinite(videoElement.duration)) {
          const realDuration = videoElement.duration;
          setActualDuration(realDuration);
          setEndTime(realDuration);
          setStartTime(0);
          setCurrentTime(0);
        }
      };

      if (videoElement.readyState >= 1) {
        updateDuration();
      } else {
        videoElement.addEventListener('loadedmetadata', updateDuration);
        return () => videoElement.removeEventListener('loadedmetadata', updateDuration);
      }
    }
  }, [videoElement]);

  // Also use the duration prop if provided
  useEffect(() => {
    if (duration > 0 && duration !== actualDuration) {
      setActualDuration(duration);
      setEndTime(duration);
      setStartTime(0);
    }
  }, [duration]);

  // Update current time from video
  useEffect(() => {
    if (!videoElement) return;

    const updateTime = () => {
      setCurrentTime(videoElement.currentTime);
    };

    videoElement.addEventListener('timeupdate', updateTime);
    return () => videoElement.removeEventListener('timeupdate', updateTime);
  }, [videoElement]);

  // Calculate positions
  const getPositionFromTime = (time) => {
    if (!actualDuration || actualDuration <= 0) return 0;
    return (time / actualDuration) * 100;
  };

  const getTimeFromPosition = (position) => {
    if (!actualDuration || actualDuration <= 0) return 0;
    return (position / 100) * actualDuration;
  };

  // Handle mouse events
  const handleMouseDown = (e) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = (x / rect.width) * 100;
    const time = getTimeFromPosition(position);
    
    // Determine what to drag
    const playheadPos = getPositionFromTime(currentTime);
    const startPos = getPositionFromTime(startTime);
    const endPos = getPositionFromTime(endTime);
    
    const threshold = 3; // 3% threshold for clicking
    
    if (Math.abs(position - playheadPos) < threshold) {
      setDragType('playhead');
    } else if (Math.abs(position - startPos) < threshold) {
      setDragType('start');
    } else if (Math.abs(position - endPos) < threshold) {
      setDragType('end');
    } else {
      // Click on timeline - move playhead
      setDragType('playhead');
      const newTime = Math.max(0, Math.min(actualDuration, time));
      setCurrentTime(newTime);
      if (onSeek) onSeek(newTime);
    }
    
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const time = getTimeFromPosition(position);

    if (!isDragging) {
      // Handle hover detection
      const playheadPos = getPositionFromTime(currentTime);
      const startPos = getPositionFromTime(startTime);
      const endPos = getPositionFromTime(endTime);
      const threshold = 3;
      
      if (Math.abs(position - playheadPos) < threshold) {
        setHoverType('playhead');
        setIsHovering(true);
      } else if (Math.abs(position - startPos) < threshold) {
        setHoverType('start');
        setIsHovering(true);
      } else if (Math.abs(position - endPos) < threshold) {
        setHoverType('end');
        setIsHovering(true);
      } else {
        setHoverType(null);
        setIsHovering(false);
      }
    } else {
      switch (dragType) {
        case 'playhead':
          const newTime = Math.max(0, Math.min(actualDuration, time));
          setCurrentTime(newTime);
          if (onSeek) onSeek(newTime);
          break;
        case 'start':
          const newStartTime = Math.max(0, Math.min(endTime - 0.1, time));
          setStartTime(newStartTime);
          break;
        case 'end':
          const newEndTime = Math.max(startTime + 0.1, Math.min(actualDuration, time));
          setEndTime(newEndTime);
          break;
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragType(null);
      
      // Notify parent of trim changes
      if (onTrimChange) {
        onTrimChange({
          startTime,
          endTime,
          duration: endTime - startTime
        });
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setHoverType(null);
  };

  // Add global mouse events
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragType]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't render if no duration is available
  if (!actualDuration || actualDuration <= 0) {
    return (
      <div className="video-timeline" style={{ width, height }}>
        <div className="relative bg-gray-200 rounded-lg border-4 border-gray-300 flex items-center justify-center" style={{ height: '100%' }}>
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2">⏳</div>
            <div className="text-sm">Loading video duration...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="video-timeline" style={{ width, height }}>
      {/* Timeline container */}
      <div 
        ref={timelineRef}
        className={`relative bg-gray-800 rounded-lg cursor-pointer border-4 shadow-lg transition-all duration-300 ${
          isDragging ? 'border-blue-400 shadow-blue-200' : 'border-gray-400'
        }`}
        style={{ height: '100%' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-lg overflow-hidden" />
        
        {/* Time markers */}
        <div className="absolute inset-0 flex justify-between items-center px-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="w-0.5 h-full bg-white bg-opacity-60 shadow-sm" />
          ))}
        </div>

        {/* Trim selection area */}
        <div
          className="absolute top-0 bottom-0 bg-blue-500 bg-opacity-60 border-l-2 border-r-2 border-blue-300 shadow-lg"
          style={{
            left: `${getPositionFromTime(startTime)}%`,
            width: `${getPositionFromTime(endTime) - getPositionFromTime(startTime)}%`
          }}
        />

        {/* Start trim handle */}
        <div
          className={`absolute top-0 bottom-0 w-3 cursor-ew-resize transition-all duration-200 ${
            isDragging && dragType === 'start' ? 'bg-blue-300 shadow-xl' : 'bg-blue-600'
          }`}
          style={{ left: `${getPositionFromTime(startTime)}%` }}
        >
          <div className={`absolute -top-3 -left-3 w-6 h-6 rounded-full border-3 border-white shadow-xl transition-all duration-200 ${
            isDragging && dragType === 'start' ? 'bg-blue-300 scale-110' : 'bg-blue-600'
          }`} />
          <div className={`absolute -bottom-3 -left-3 w-6 h-6 rounded-full border-3 border-white shadow-xl transition-all duration-200 ${
            isDragging && dragType === 'start' ? 'bg-blue-300 scale-110' : 'bg-blue-600'
          }`} />
        </div>

        {/* End trim handle */}
        <div
          className={`absolute top-0 bottom-0 w-3 cursor-ew-resize transition-all duration-200 ${
            isDragging && dragType === 'end' ? 'bg-blue-300 shadow-xl' : 'bg-blue-600'
          }`}
          style={{ left: `${getPositionFromTime(endTime)}%` }}
        >
          <div className={`absolute -top-3 -left-3 w-6 h-6 rounded-full border-3 border-white shadow-xl transition-all duration-200 ${
            isDragging && dragType === 'end' ? 'bg-blue-300 scale-110' : 'bg-blue-600'
          }`} />
          <div className={`absolute -bottom-3 -left-3 w-6 h-6 rounded-full border-3 border-white shadow-xl transition-all duration-200 ${
            isDragging && dragType === 'end' ? 'bg-blue-300 scale-110' : 'bg-blue-600'
          }`} />
        </div>

        {/* Playhead */}
        <div
          className={`absolute top-0 bottom-0 w-1 transition-all duration-200 ${
            isDragging && dragType === 'playhead' ? 'bg-yellow-300 shadow-xl' : 'bg-white'
          }`}
          style={{ left: `${getPositionFromTime(currentTime)}%` }}
        >
          <div className={`absolute -top-3 -left-3 w-6 h-6 rounded-full border-2 border-blue-500 shadow-xl transition-all duration-200 ${
            isDragging && dragType === 'playhead' ? 'bg-yellow-300 scale-110' : 'bg-white'
          }`} />
        </div>

        {/* Current time label - positioned to avoid overlap */}
        <div className="absolute bottom-2 text-white text-xs font-bold bg-black bg-opacity-80 px-2 py-1 rounded shadow-lg"
             style={{ left: `max(8px, min(calc(${getPositionFromTime(currentTime)}% - 25px), calc(100% - 70px)))` }}>
          {formatTime(currentTime)}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mt-4 p-3 bg-gray-100 rounded-lg shadow-lg border border-gray-300">
        <div className="flex items-center space-x-4">
          <div className="text-sm font-bold text-gray-700 bg-white px-3 py-1 rounded-full shadow-sm border">
            <span className="text-gray-500">Start:</span> <span className="text-blue-600">{formatTime(startTime)}</span>
          </div>
          <div className="text-sm font-bold text-gray-700 bg-white px-3 py-1 rounded-full shadow-sm border">
            <span className="text-gray-500">End:</span> <span className="text-blue-600">{formatTime(endTime)}</span>
          </div>
          <div className="text-sm font-bold text-gray-700 bg-white px-3 py-1 rounded-full shadow-sm border">
            <span className="text-gray-500">Duration:</span> <span className="text-green-600">{formatTime(endTime - startTime)}</span>
          </div>
        </div>
        <button
          onClick={() => {
            setStartTime(0);
            setEndTime(actualDuration);
            if (onTrimChange) {
              onTrimChange({ startTime: 0, endTime: actualDuration, duration: actualDuration });
            }
          }}
          className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg text-sm font-medium shadow-lg transition-all duration-300 border border-gray-400 hover:shadow-xl transform hover:scale-105 active:scale-95"
        >
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 border border-gray-600 rounded" />
            <span>Reset</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default VideoTimeline;