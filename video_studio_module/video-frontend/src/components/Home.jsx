import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getVideos, getFinalVideo, getVideoStreamUrl, checkVideoLimit } from '../api/video';

const Home = () => {
  const [userVideos, setUserVideos] = useState([]);
  const [finalVideo, setFinalVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finalVideoLoading, setFinalVideoLoading] = useState(true);
  const [videoLimit, setVideoLimit] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserVideos();
    loadFinalVideo();
    loadVideoLimit();
  }, []);

  const loadVideoLimit = async () => {
    try {
      const userId = 1; // Default user ID
      const limitData = await checkVideoLimit(userId);
      setVideoLimit(limitData);
    } catch (error) {
      console.error('Error loading video limit:', error);
    }
  };

  const loadUserVideos = async () => {
    try {
      const videos = await getVideos();
      let videoArray = [];
      if (Array.isArray(videos)) {
        videoArray = videos;
      } else if (videos && Array.isArray(videos.results)) {
        videoArray = videos.results;
      }
      setUserVideos(videoArray);
    } catch (error) {
      console.error('Error loading user videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFinalVideo = async () => {
    try {
      setFinalVideoLoading(true);
      const video = await getFinalVideo();
      console.log('Final video loaded in Home:', video);
      setFinalVideo(video);
    } catch (error) {
      console.error('Error loading final video:', error);
      setFinalVideo(null);
    } finally {
      setFinalVideoLoading(false);
    }
  };

  const getStatusBadge = (video) => {
    if (video.isFinal) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">⭐ Final</span>;
    }
    if (video.isValidated) {
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">✓ Validated</span>;
    }
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">⏳ Pending</span>;
  };

  const getAIFeedbackStatus = (video) => {
    if (video.aiFeedbackRequested && video.aiFeedbackReceived) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">🤖 Evaluated</span>;
    }
    if (video.aiFeedbackRequested) {
      return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">⏳ AI Processing</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Not Requested</span>;
  };

  return (
    <div className="main-content">
      {/* Main Content Area */}
      <div className="w-full">
        {/* Profile Header */}
        <div className="profile-section">
          <div className="profile-header">
            <div>
              <h1 className="profile-name">Video Studio User</h1>
              <p className="profile-languages">English, French</p>
            </div>
          </div>

          {/* Studio Vidéo Section */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Video Studio</h2>
              <div className="section-action">
                <span>🎬</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    🎬
                  </div>
                  <div>
                    <p className="font-medium">New Recording</p>
                    <p className="text-sm text-gray-500">Create a new video presentation</p>
                  </div>
                </div>
                <Link to="/record" className="btn btn-sm btn-primary">
                  Start
                </Link>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    📹
                  </div>
                  <div>
                    <p className="font-medium">My Videos</p>
                    <p className="text-sm text-gray-500">Manage my creations ({userVideos.length} videos)</p>
                  </div>
                </div>
                <Link to="/my-videos" className="btn btn-sm btn-secondary">
                  View
                </Link>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    📱
                  </div>
                  <div>
                    <p className="font-medium">QR Mobile</p>
                    <p className="text-sm text-gray-500">Recording from mobile</p>
                  </div>
                </div>
                <Link to="/qr-generator" className="btn btn-sm btn-accent">
                  Generate
                </Link>
              </div>
            </div>
          </div>

          {/* Final Video Section - Using VideoProfile Style */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Vidéo de Profil</h2>
              <div className="section-action">
                <span>⭐</span>
              </div>
            </div>
            
            {finalVideoLoading ? (
              <div className="final-video-loading">
                <div className="loading-spinner"></div>
                <p className="final-video-loading-text">Chargement de votre vidéo finale...</p>
              </div>
            ) : finalVideo ? (
              <div className="final-video-container">
                <div className="final-video-header">
                  <h3 className="final-video-title">{finalVideo.title || 'Presentation video'}</h3>
                  <div className="final-video-meta">
                    <div className="final-video-meta-item">
                      <span className="final-video-meta-icon">📅</span>
                      <span>Enregistrée le: {new Date(finalVideo.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</span>
                    </div>
                    {finalVideo.duration && (
                      <div className="final-video-meta-item">
                        <span className="final-video-meta-icon">⏱️</span>
                        <span>Durée: {finalVideo.duration}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="final-video-player-container">
                  <video 
                    controls 
                    className="final-video-player"
                    src={getVideoStreamUrl(finalVideo.id)}
                    preload="metadata"
                    onError={(e) => {
                      console.error('Video loading error:', e);
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                
                <div className="final-video-status-section">
                  <div className="final-video-status-row">
                    <div className="final-video-status-badge">
                      ⭐ Vidéo Finale
                    </div>
                    <span className="final-video-id">ID: {finalVideo.id}</span>
                  </div>
                  
                  <div className="final-video-actions">
                    <button 
                      onClick={() => navigate('/my-videos')}
                      className="final-video-primary-btn"
                    >
                      📋 Gérer mes vidéos
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="final-video-empty">
                <div className="final-video-empty-icon">📹</div>
                <h3 className="final-video-empty-title">Aucune vidéo finale</h3>
                <p className="final-video-empty-description">
                  Vous n'avez pas encore sélectionné de vidéo finale pour votre profil.
                </p>
                <div className="final-video-empty-actions">
                  {videoLimit && !videoLimit.can_record ? (
                    <div className="text-center">
                      <button 
                        disabled
                        className="final-video-primary-btn opacity-50 cursor-not-allowed"
                      >
                        🚫 Limite atteinte ({videoLimit.video_count}/{videoLimit.max_videos})
                      </button>
                      <p className="text-sm text-red-600 mt-2">
                        Supprimez une vidéo pour enregistrer une nouvelle
                      </p>
                    </div>
                  ) : (
                    <button 
                      onClick={() => navigate('/record')}
                      className="final-video-primary-btn"
                    >
                      🎬 Enregistrer une vidéo
                      {videoLimit && (
                        <span className="text-xs block mt-1 text-gray-600">
                          ({videoLimit.video_count}/{videoLimit.max_videos} utilisés)
                        </span>
                      )}
                    </button>
                  )}
                  <button 
                    onClick={() => navigate('/my-videos')}
                    className="final-video-secondary-btn"
                  >
                    📋 Mes vidéos
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* About Section */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">About</h2>
              <div className="section-action">
                <span>✏️</span>
              </div>
            </div>
            <p className="text-gray-600">Professional video recording and management platform</p>
          </div>

          {/* Skills Section */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Skills</h2>
              <div className="section-action">
                <span>✏️</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="skill-tag">Video</span>
              <span className="skill-tag">Presentation</span>
              <span className="skill-tag">Communication</span>
            </div>
          </div>

          {/* Resume Section */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">CV</h2>
            </div>
            <div className="flex gap-3">
              <button className="btn btn-primary">
                📄 Replace CV
              </button>
              <button className="btn btn-danger">
                🗑️ Delete
              </button>
            </div>
          </div>

          {/* Education Section */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Education</h2>
              <button className="btn btn-sm btn-primary">
                + Add
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    🎓
                  </div>
                  <div>
                    <p className="font-medium">Video Training</p>
                    <p className="text-sm text-gray-500">University - Master - Communication</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-gray-400 hover:text-gray-600">✏️</button>
                  <button className="text-gray-400 hover:text-red-600">🗑️</button>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Experience */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Professional Experience</h2>
              <button className="btn btn-sm btn-primary">
                + Add
              </button>
            </div>
            <p className="text-gray-500 text-center py-8">No experience added</p>
          </div>

          {/* Contact Section */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Contact</h2>
              <div className="section-action">
                <span>✏️</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span>📧</span>
                <span>Email: user@videostudio.com</span>
              </div>
              <div className="flex items-center gap-3">
                <span>📱</span>
                <span>Phone number: +33 6 12 34 56 78</span>
              </div>
            </div>
          </div>

          {/* LinkedIn Section */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">LinkedIn</h2>
            </div>
            <div className="flex items-center gap-3">
              <span>💼</span>
              <input 
                type="text" 
                placeholder="LinkedIn Link" 
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{userVideos.length}</div>
            <div className="text-gray-600">Total videos</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {userVideos.filter(v => v.isFinal).length}
            </div>
            <div className="text-gray-600">Final videos</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {userVideos.filter(v => v.aiFeedbackReceived).length}
            </div>
            <div className="text-gray-600">AI Evaluated</div>
          </div>
        </div>
    </div>
  );
};

export default Home;