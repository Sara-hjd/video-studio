// video-frontend/src/components/MyVideos.jsx

import React, { useState, useEffect } from 'react';
import { getVideos, requestAIFeedback, markVideoAsFinal, deleteVideo, changeVideoStatus, getVideoStatusTransitions } from '../api/video';
import VideoPlayer from './VideoPlayer';
import VideoEditor from './VideoEditor';
import VideoThumbnail from './VideoThumbnail';
import { useNotification } from '../hooks/useModal';
import CenteredPopup from './CenteredPopup';
import ConfirmationModal from './ConfirmationModal';

const MyVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusTransitions, setStatusTransitions] = useState({});
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [updatingFinal, setUpdatingFinal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isVisible: false, videoId: null });
  
  // Notification hook
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();

  // Handle duration extraction from video
  const handleDurationExtracted = (videoId, duration) => {
    console.log('Duration extracted for video', videoId, ':', duration);
    setVideos(prevVideos => 
      prevVideos.map(video => 
        video.id === videoId 
          ? { ...video, duration: duration }
          : video
      )
    );
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading videos...');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Server is taking too long to respond')), 10000)
      );
      
      const userVideos = await Promise.race([getVideos(), timeoutPromise]);
      console.log('Videos loaded:', userVideos);
      console.log('Videos array length:', userVideos ? userVideos.length : 0);
      
      // Traiter les vidéos pour s'assurer que les propriétés isFinal et isValidated sont correctes
      let processedVideos = (userVideos || []).map(video => ({
        ...video,
        isFinal: video.final_validated || video.status === 'final',
        isValidated: video.validated || video.status === 'validated' || video.status === 'final'
      }));
      
      // Fetch video URLs for each video (like VideoEditor does)
      const API_BASE_URL = 'https://192.168.1.168/api/videos';
      const videosWithUrls = await Promise.all(
        processedVideos.map(async (video) => {
          try {
            const response = await fetch(`${API_BASE_URL}/${video.id}/video_info/`);
            if (response.ok) {
              const data = await response.json();
              return {
                ...video,
                // Use original video URL if API URL is different/empty
                video: data.video_url && data.video_url !== video.video ? data.video_url : video.video
              };
            }
          } catch (err) {
            console.error(`Error fetching video info for ${video.id}:`, err);
          }
          return video; // Return original video if fetch fails
        })
      );
      
      console.log('Processed videos with URLs:', videosWithUrls);
      setVideos(videosWithUrls);
      
      if (videosWithUrls && videosWithUrls.length > 0) {
        const transitionPromises = videosWithUrls.map(async (video) => {
          try {
            const transitionData = await getVideoStatusTransitions(video.id);
            return { videoId: video.id, transitions: transitionData.available_transitions };
          } catch (err) {
            console.error(`Error loading transitions for video ${video.id}:`, err);
            return { videoId: video.id, transitions: [] };
          }
        });
        const transitionResults = await Promise.all(transitionPromises);
        const transitions = {};
        transitionResults.forEach(result => {
          transitions[result.videoId] = result.transitions;
        });
        setStatusTransitions(transitions);
      }
    } catch (err) {
      console.error('Error loading videos:', err);
      
      // Handle specific error types
      if (err.message.includes('502') || err.message.includes('Bad Gateway')) {
        setError('Server is temporarily unavailable. Please try again in a few moments.');
      } else if (err.message.includes('Timeout')) {
        setError('Server is taking too long to respond. Check your connection.');
      } else if (err.message.includes('Network')) {
        setError('Connection problem. Check your network.');
      } else {
        setError('Error loading videos: ' + err.message);
      }
      
      // Set empty array to prevent crashes
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAIFeedback = async (videoId) => {
    try {
      await requestAIFeedback(videoId);
      setVideos(prevVideos =>
        prevVideos.map(video =>
          video.id === videoId
            ? { ...video, aiFeedbackRequested: true }
            : video
        )
      );
      showSuccess('Request sent!', 'AI evaluation request sent successfully!');
    } catch (err) {
      showError('Request error', 'Error requesting AI evaluation');
      console.error('Error requesting AI feedback:', err);
    }
  };

  const handleMarkAsFinal = async (videoId) => {
    try {
      setUpdatingFinal(true);
      const result = await markVideoAsFinal(videoId);
      
      // Mettre à jour l'état des vidéos selon la réponse
      setVideos(prevVideos =>
        prevVideos.map(video => {
          if (video.id === videoId) {
            // Mettre à jour la vidéo marquée comme finale
            return {
              ...video,
              final_validated: true,
              isFinal: true,
              status: 'final',
              statusDisplay: 'Finale'
            };
          } else {
            // Démarrer toutes les autres vidéos du même utilisateur
            return {
              ...video,
              final_validated: false,
              isFinal: false,
              status: video.status === 'final' ? 'validated' : video.status,
              statusDisplay: video.status === 'final' ? 'Validated' : video.statusDisplay
            };
          }
        })
      );
      
      // Afficher un message approprié selon le résultat
      if (result.already_final) {
        showWarning('Already final', 'This video is already marked as final!');
      } else if (result.replaced_previous) {
        showSuccess('Final video!', 'Video marked as final! The previous final video has been replaced.');
      } else {
        showSuccess('Final video!', 'Video marked as final!');
      }
      
      // Recharger les vidéos depuis le serveur pour s'assurer de la cohérence
      await loadVideos();
      
    } catch (err) {
      showError('Marking error', 'Error marking the video');
      console.error('Error marking video as final:', err);
    } finally {
      setUpdatingFinal(false);
    }
  };

  const handleDeleteVideo = (videoId) => {
    setDeleteConfirmation({ isVisible: true, videoId });
  };

  const confirmDeleteVideo = async () => {
    const { videoId } = deleteConfirmation;
    setDeleteConfirmation({ isVisible: false, videoId: null });
    
    try {
      await deleteVideo(videoId);
      setVideos(prevVideos => prevVideos.filter(video => video.id !== videoId));
      showSuccess('Video deleted!', 'Video has been deleted successfully');
    } catch (err) {
      showError('Deletion error', 'Error deleting the video');
      console.error('Error deleting video:', err);
    }
  };

  const cancelDeleteVideo = () => {
    setDeleteConfirmation({ isVisible: false, videoId: null });
  };

  const handleEditVideo = (video) => {
    console.log('Opening video editor for:', video);
    setEditingVideo(video);
    
    // Auto-scroll to video editor when it opens
    setTimeout(() => {
      const videoEditor = document.querySelector('.video-editor-container');
      if (videoEditor) {
        videoEditor.scrollIntoView({ 
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
  };

  const handleEditSave = (editResult) => {
    // Mettre à jour la vidéo avec les nouvelles informations
    setVideos(prevVideos =>
      prevVideos.map(video =>
        video.id === editingVideo.id
          ? { ...video, video: editResult.new_video_url }
          : video
      )
    );
    setEditingVideo(null);
    showSuccess('Video edited!', 'Video edited successfully!');
  };

  const handleEditCancel = () => {
    setEditingVideo(null);
  };

  const handleStatusChange = async (videoId, newStatus) => {
    try {
      const result = await changeVideoStatus(videoId, newStatus);
      setVideos(prevVideos =>
        prevVideos.map(video =>
          video.id === videoId
            ? {
              ...video,
              status: result.status,
              statusDisplay: result.statusDisplay,
              isFinal: result.status === 'final',
              isValidated: ['validated', 'final'].includes(result.status)
            }
            : video
        )
      );
      showSuccess('Status changed!', `Status changed to: ${result.statusDisplay}`);
    } catch (err) {
      showError('Status error', `Error changing status: ${err.message}`);
      console.error('Error changing status:', err);
    }
  };

  const handlePlayVideo = (video) => {
    console.log("handlePlayVideo called with video:", video);
    setSelectedVideo(video);
  };

  const handleCloseVideo = () => {
    setSelectedVideo(null);
  };

  const getStatusBadge = (video) => {
    if (video.isFinal) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Finale</span>;
    }
    if (video.isValidated) {
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Validée</span>;
    }
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">En attente</span>;
  };

  const getAIFeedbackStatus = (video) => {
    if (video.aiFeedbackRequested && video.aiFeedbackReceived) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">✓ Évaluée</span>;
    }
    if (video.aiFeedbackRequested) {
      return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">⏳ En cours</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Non demandée</span>;
  };

  const getStatusActions = (video) => {
    return null;
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="flex justify-center items-center h-64">
          <div className="loading-spinner"></div>
          <p className="ml-3">Chargement de vos vidéos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Mes Vidéos</h1>
        <p className="page-subtitle">
          Gérez vos vidéos enregistrées ({videos.length}/3 maximum)
        </p>
                          {videos.some(video => video.isFinal) && (
           <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
             <div className="flex items-center">
               <span className="text-green-600 text-lg mr-2">⭐</span>
               <div>
                 <p className="text-sm text-green-800 font-medium">
                   Vidéo finale sélectionnée
                 </p>
                 <p className="text-xs text-green-600">
                   Cette vidéo s'affiche sur votre profil
                 </p>
               </div>
             </div>
           </div>
         )}
         {updatingFinal && (
           <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
             <div className="flex items-center">
               <span className="text-blue-600 text-lg mr-2">⏳</span>
               <div>
                 <p className="text-sm text-blue-800 font-medium">
                   Mise à jour en cours...
                 </p>
                 <p className="text-xs text-blue-600">
                   Veuillez patienter pendant la mise à jour de la vidéo finale
                 </p>
               </div>
             </div>
           </div>
         )}
      </div>
      {error && (
        <div className="card mb-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        </div>
      )}
      {videos.length >= 3 && (
        <div className="card mb-6">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-yellow-600 text-xl mr-2">⚠️</span>
              <div>
                <h4 className="font-medium text-yellow-800">Limite atteinte</h4>
                <p className="text-sm text-yellow-700">
                  Vous avez atteint la limite de 3 vidéos. Supprimez une vidéo existante pour en enregistrer une nouvelle.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {videos.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📹</div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">Aucune vidéo enregistrée</h3>
            <p className="text-gray-600 mb-4">
              Commencez par enregistrer votre première vidéo de présentation.
            </p>
            <a href="/record" className="btn btn-primary">
              🎬 Enregistrer ma première vidéo
            </a>
          </div>
        </div>
      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="card">
              {/* Video Thumbnail */}
              <div className="relative mb-4">
                <VideoThumbnail 
                  video={video} 
                  onDurationExtracted={handleDurationExtracted}
                  onPlayClick={handlePlayVideo}
                />
                <div className="absolute top-2 left-2">
                  {getStatusBadge(video)}
                </div>
                {video.isFinal && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-green-600 text-white rounded-full text-xs font-medium animate-pulse">
                      ⭐ Vidéo Finale
                    </span>
                  </div>
                )}
              </div>
              {/* Video Info */}
              <div className="mb-4">
                <h3 className="font-semibold text-lg mb-2">{video.title || 'Untitled video'}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-medium">{video.duration || '--:--'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recorded on:</span>
                    <span>{new Date(video.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>AI Evaluation:</span>
                    <span>{getAIFeedbackStatus(video)}</span>
                  </div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="space-y-2">
                {/* Play Button */}
                <button
                  onClick={() => handlePlayVideo(video)}
                  className="btn btn-primary w-full btn-sm"
                >
                  ▶️ Regarder la vidéo
                </button>
                {/* AI Feedback Request */}
                {!video.aiFeedbackRequested && (
                  <button
                    onClick={() => handleRequestAIFeedback(video.id)}
                    className="btn btn-secondary w-full btn-sm"
                  >
                    🤖 Demander évaluation IA
                  </button>
                )}
                {/* Bouton Marquer comme finale */}
                {/* Edit Video Button */}
                {!video.isFinal && (
                  <button
                    onClick={() => {
                      console.log('Edit button clicked for video:', video.id);
                      handleEditVideo(video);
                    }}
                    className="btn btn-primary w-full btn-sm hover:bg-blue-600 hover:text-white"
                  >
                    ✂️ Éditer la vidéo
                  </button>
                )}
                {video.isFinal ? (
                  <button
                    disabled
                    className="btn btn-success w-full btn-sm opacity-75 cursor-not-allowed"
                  >
                    ✅ Vidéo Finale Actuelle
                  </button>
                ) : (
                  <button
                    onClick={() => handleMarkAsFinal(video.id)}
                    disabled={updatingFinal}
                    className={`btn btn-accent w-full btn-sm transition-colors ${
                      updatingFinal 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-yellow-600 hover:text-white'
                    }`}
                  >
                    {updatingFinal ? '⏳ Updating...' : '⭐ Mark as final'}
                  </button>
                )}
                {/* View AI Feedback */}
                {video.aiFeedbackRequested && video.aiFeedbackReceived && (
                  <a
                    href={`/feedback?video=${video.id}`}
                    className="btn btn-secondary w-full btn-sm"
                  >
                    📊 Voir l'évaluation IA
                  </a>
                )}
                {/* Delete Video */}
                <button
                  onClick={() => handleDeleteVideo(video.id)}
                  className="btn btn-secondary w-full btn-sm text-red-600 hover:bg-red-50"
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {videos.length < 3 && (
        <div className="card mt-6">
          <div className="text-center">
            <h3 className="font-semibold text-lg mb-2">Enregistrer une nouvelle vidéo</h3>
            <p className="text-gray-600 mb-4">
              Vous pouvez encore enregistrer {3 - videos.length} vidéo{3 - videos.length > 1 ? 's' : ''}.
            </p>
            <a href="/record" className="btn btn-primary">
              🎬 Enregistrer une vidéo
            </a>
          </div>
        </div>
      )}
      {selectedVideo && (
        <VideoPlayer
          videoId={selectedVideo.id}
          title={selectedVideo.title || 'Video'}
          onClose={handleCloseVideo}
        />
      )}
      {editingVideo && (
        <div className="fixed inset-0 modal-enhanced flex items-center justify-center z-[9999] p-4">
          <div className="modal-content-enhanced rounded-xl max-w-6xl w-full modal-enter">
            <VideoEditor
              video={editingVideo}
              onSave={handleEditSave}
              onCancel={handleEditCancel}
            />
          </div>
        </div>
      )}

      <CenteredPopup
        isVisible={notification.isVisible}
        onClose={hideNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        duration={0}
        showCloseButton={true}
      />

      <ConfirmationModal
        isVisible={deleteConfirmation.isVisible}
        onClose={cancelDeleteVideo}
        onConfirm={confirmDeleteVideo}
        title="Confirm deletion"
        message="Are you sure you want to delete this video? This action is irreversible."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default MyVideos;