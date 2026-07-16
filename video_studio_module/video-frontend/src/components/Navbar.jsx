import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getVideos } from '../api/video';

const Navbar = () => {
  const [hasVideo, setHasVideo] = useState(false);
  const [hasAIFeedback, setHasAIFeedback] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check if user has videos and AI feedback
    getVideos()
      .then((videos) => {
        const hasVideos = Array.isArray(videos) && videos.length > 0;
        const hasAIRequested = videos.some(video => video.aiFeedbackRequested);
        setHasVideo(hasVideos);
        setHasAIFeedback(hasAIRequested);
      })
      .catch(() => {
        setHasVideo(false);
        setHasAIFeedback(false);
      });
  }, []);

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo">JG</div>
          <span className="brand-job">JOB</span>
          <span className="brand-gate">GATE</span>
        </Link>
        
        <ul className="navbar-nav">
          <li>
            <Link 
              to="/" 
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
            >
              📊 Dashboard
            </Link>
          </li>
          <li>
            <Link 
              to="/record" 
              className={`nav-link ${isActive('/record') ? 'active' : ''}`}
            >
              🎬 Record
            </Link>
          </li>
          <li>
            <Link 
              to="/my-videos" 
              className={`nav-link ${isActive('/my-videos') ? 'active' : ''}`}
            >
              📹 My Videos
            </Link>
          </li>
          <li>
            <Link 
              to="/qr-generator" 
              className={`nav-link ${isActive('/qr-generator') ? 'active' : ''}`}
            >
              📱 QR Mobile
            </Link>
          </li>
          <li>
            <Link 
              to="/profile" 
              className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
            >
              👤 Profile
            </Link>
          </li>
          <li>
            <Link 
              to="/system-alerts" 
              className={`nav-link ${isActive('/system-alerts') ? 'active' : ''}`}
            >
              🚨 Monitoring
            </Link>
          </li>
          {hasAIFeedback && (
            <li>
              <Link 
                to="/feedback" 
                className={`nav-link ${isActive('/feedback') ? 'active' : ''}`}
              >
                🤖 AI Feedback
              </Link>
            </li>
          )}
        </ul>
        
        {/* User Avatar - JOBGATE Style */}
        <div className="user-avatar">
          A
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 