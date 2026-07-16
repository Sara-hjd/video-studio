// video-frontend/src/api/video.js
const API_BASE = process.env.REACT_APP_API_URL || 'https://192.168.1.168/api';

// Récupérer toutes les vidéos de l'utilisateur
export const getVideos = async (userId = null) => {
  let url = `${API_BASE}/videos/`;
  if (userId) {
    url += `?user_id=${userId}`;
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des vidéos: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    // Always return an array
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.results)) {
      return data.results;
    }
    return [];
  } catch (error) {
    console.error("Error fetching videos:", error);
    throw error; // Re-throw the error to be handled by the component
  }
};

// Obtenir l'URL de streaming d'une vidéo
export const getVideoStreamUrl = (videoId) => {
  return `${API_BASE}/videos/${videoId}/stream/`;
};

// Vérifier la limite de vidéos pour un utilisateur
export const checkVideoLimit = async (userId) => {
  try {
    const response = await fetch(`${API_BASE}/videos/check_video_limit/?user_id=${userId}`);
    if (!response.ok) {
      throw new Error(`Erreur lors de la vérification de la limite: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error checking video limit:", error);
    throw error;
  }
};

// Upload d'une nouvelle vidéo
export const uploadVideo = async (file, status = 'draft', duration = null) => {
  console.log('uploadVideo called with:', { fileName: file.name, fileSize: file.size, status, duration });
  
  const formData = new FormData();
  formData.append('video', file); // <-- must match your Django model field!
  formData.append('title', file.name);
  formData.append('status', status);
  
  // Add duration if provided
  if (duration !== null && duration !== undefined) {
    formData.append('duration', duration.toString());
  }

  console.log('FormData created, sending request to:', `${API_BASE}/videos/`);
  console.log('FormData entries:', Array.from(formData.entries()));

  try {
    console.log('Starting fetch request...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`${API_BASE}/videos/`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);
    console.log('Response received:', { status: response.status, statusText: response.statusText });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error text:', errorText);
      throw new Error(`Erreur lors de l'upload de la vidéo: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Upload successful, result:', result);
    return result;
  } catch (error) {
    console.error("Error uploading video:", error);
    
    if (error.name === 'AbortError') {
      throw new Error('Timeout: Upload prend trop de temps (30s)');
    } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      throw new Error('Erreur réseau: Impossible de se connecter au serveur');
    } else {
      throw error; // Re-throw the error to be handled by the component
    }
  }
};

const validateAndUpload = async (blob, mimeType) => {
  if (blob && blob.size > 0) {
    try {
      let extension = 'webm';
      if (mimeType.includes('mp4')) extension = 'mp4';
      const file = new File([blob], `video_${Date.now()}.${extension}`, { type: mimeType });
      //const { uploadVideo } = await import('../api/video'); // No need to import here, it's already in scope
      // Always upload as draft
      const result = await uploadVideo(file, 'draft');
      setRecordedChunks([]);
      setRecordingTime(0);
      setIsRecording(false);
      setShowCountdown(false);
      setCountdown(0);
      setError(null);
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current = null;
      }
      console.log('Vidéo enregistrée avec succès !');
      // navigate('/my-videos'); // This should be handled by the component
    } catch (error) {
      setError('Erreur lors de l\'enregistrement: ' + error.message);
    }
  } else {
    setError('Aucune vidéo à valider. Veuillez d\'abord enregistrer une vidéo.');
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
    setUserVideos([]); // Pour éviter le crash
  } finally {
    setLoading(false);
  }
};

// Demander un feedback IA
export const requestAIFeedback = async (videoId) => {
  try {
    const response = await fetch(`${API_BASE}/videos/${videoId}/request_ai_feedback/`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`Erreur lors de la demande de feedback IA: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error requesting AI feedback:", error);
    throw error; // Re-throw the error to be handled by the component
  }
};

// Marquer une vidéo comme finale
export const markVideoAsFinal = async (videoId) => {
  try {
    const response = await fetch(`${API_BASE}/videos/${videoId}/mark_final/`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`Erreur lors du marquage final: ${response.status} ${response.statusText}`);
    }
    const result = await response.json();
    console.log('Mark final result:', result);
    return result;
  } catch (error) {
    console.error("Error marking video as final:", error);
    throw error; // Re-throw the error to be handled by the component
  }
};

// Supprimer une vidéo
export const deleteVideo = async (videoId) => {
  try {
    const response = await fetch(`${API_BASE}/videos/${videoId}/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Erreur lors de la suppression: ${response.status} ${response.statusText}`);
    }
    return true;
  } catch (error) {
    console.error("Error deleting video:", error);
    throw error; // Re-throw the error to be handled by the component
  }
};

// Valider une vidéo
export const validateVideo = () => {
  if (isRecording && mediaRecorderRef.current) {
    setShouldValidateAfterStop(true);
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    return;
  }
  // If not recording, but have a recorded video, upload and validate
  if (uploadBlobRef.current) {
    validateAndUpload(uploadBlobRef.current, uploadBlobRef.current.type);
  } else {
    setError('Aucune vidéo à valider. Veuillez d\'abord enregistrer une vidéo.');
  }
};

// Changer le statut d'une vidéo
export const changeVideoStatus = async (videoId, newStatus) => {
  try {
    const response = await fetch(`${API_BASE}/videos/${videoId}/change_status/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erreur lors du changement de statut: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error changing video status:", error);
    throw error; // Re-throw the error to be handled by the component
  }
};

// Obtenir les transitions de statut possibles
export const getVideoStatusTransitions = async (videoId) => {
  try {
    const response = await fetch(`${API_BASE}/videos/${videoId}/status_transitions/`, {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des transitions: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error getting video status transitions:", error);
    throw error; // Re-throw the error to be handled by the component
  }
};

// Obtenir la vidéo finale d'un utilisateur
export const getFinalVideo = async (userId = null) => {
  try {
    const url = userId 
      ? `${API_BASE}/videos/final_video/?user_id=${userId}`
      : `${API_BASE}/videos/final_video/`;
    
    console.log('Fetching final video from URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
    });
    
    console.log('Final video response status:', response.status);
    
    if (response.status === 404) {
      console.log('No final video found (404)');
      return null; // No final video found
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || `Erreur ${response.status}: ${response.statusText}`;
      console.error('Final video error response:', errorData);
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Final video data received:', data);
    return data;
  } catch (error) {
    console.error("Error getting final video:", error);
    throw error;
  }
};