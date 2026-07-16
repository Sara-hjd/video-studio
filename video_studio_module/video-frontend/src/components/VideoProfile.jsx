// video-frontend/src/components/VideoProfile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFinalVideo, getVideoStreamUrl } from '../api/video';

const VideoProfile = () => {
  const navigate = useNavigate();
  const [finalVideo, setFinalVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoError, setVideoError] = useState(null);

  const loadFinalVideo = async () => {
    try {
      setLoading(true); // set loading to true when starting data fetching
      setError(null); // Ensure any previous errors are cleared
      const video = await getFinalVideo(); // This will return only the final validated video
      console.log('Final video loaded:', video);
      if (video) {
        setFinalVideo(video);
        console.log('Video stream URL:', getVideoStreamUrl(video.id));
      } else {
        setFinalVideo(null); // No final validated video found
      }
           } catch (error) {
       console.error('Error loading final video:', error);
       setFinalVideo(null);
       
       // Handle specific error cases
       if (error.message.includes('No users found') || error.message.includes('No final video found')) {
         // This is not really an error, just no data
         setError(null);
       } else {
         setError(`Erreur lors du chargement de la vidéo finale: ${error.message}`);
       }
     } finally {
      setLoading(false); // set loading to false after data is fetched whether error or not
    }
  };

  useEffect(() => {
    loadFinalVideo();
  }, []);

  if (loading) {
    return (
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">Vidéo de Profil</h1>
          <p className="page-subtitle">
            Votre vidéo finale sélectionnée
          </p>
        </div>
        
        <div className="card">
          <div className="flex justify-center items-center h-64">
            <div className="loading-spinner"></div>
            <p className="ml-3">Chargement de votre vidéo finale...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">Vidéo de Profil</h1>
          <p className="page-subtitle">
            Votre vidéo finale sélectionnée
          </p>
        </div>
        
        <div className="card">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <h3 className="font-medium mb-2">Erreur</h3>
            <p>{error}</p>
            <div className="mt-4">
              <button 
                onClick={loadFinalVideo}
                className="btn btn-primary btn-sm"
              >
                🔄 Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!finalVideo) {
    return (
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">Vidéo de Profil</h1>
          <p className="page-subtitle">
            Votre vidéo finale sélectionnée
          </p>
        </div>
        
        <div className="final-video-empty">
          <div className="final-video-empty-icon">📹</div>
          <h3 className="final-video-empty-title">Aucune vidéo finale</h3>
          <p className="final-video-empty-description">
            Vous n'avez pas encore sélectionné de vidéo finale pour votre profil.
          </p>
          <div className="final-video-empty-actions">
            <button 
              onClick={() => navigate('/record')}
              className="final-video-primary-btn"
            >
              🎬 Enregistrer une vidéo
            </button>
            <button 
              onClick={() => navigate('/my-videos')}
              className="final-video-secondary-btn"
            >
              📋 Mes vidéos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Vidéo de Profil</h1>
        <p className="page-subtitle">
          Votre vidéo finale sélectionnée
        </p>
      </div>
      
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
              setVideoError('Error loading video');
            }}
            onLoadStart={() => setVideoError(null)}
          >
            Your browser does not support the video tag.
          </video>
          {videoError && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50">
              <div className="text-center p-4">
                <p className="text-red-600 font-medium">{videoError}</p>
                <p className="text-sm text-red-500 mt-1">Vérifiez que le serveur backend est en cours d'exécution</p>
              </div>
            </div>
          )}
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
            <button 
              onClick={loadFinalVideo}
              className="final-video-secondary-btn"
            >
              🔄 Rafraîchir
            </button>
            <button 
              onClick={() => {
                console.log('Video details:', finalVideo);
                console.log('Stream URL:', getVideoStreamUrl(finalVideo.id));
              }}
              className="final-video-debug-btn"
              title="Afficher les détails de la vidéo dans la console"
            >
              🔍 Debug Vidéo
            </button>
            <button 
              onClick={async () => {
                try {
                  const response = await fetch('https://192.168.1.168/api/videos/debug_videos/');
                  const data = await response.json();
                  console.log('Debug data:', data);
                  console.log('Debug data logged to console');
                } catch (error) {
                  console.error('Debug error:', error);
                  console.error('Debug error: ' + error.message);
                }
              }}
              className="final-video-debug-btn"
              title="Afficher les données du backend dans la console"
            >
              🔍 Debug Backend
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoProfile;