import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generalInstructions, industryInstructions } from '../data/instructionsData';
import { useNavigate } from 'react-router-dom';
import { uploadVideo, checkVideoLimit } from '../api/video';
import { QRCodeSVG } from 'qrcode.react';
import CustomModal from './CustomModal';
import CameraPermissionModal from './CameraPermissionModal';
import CenteredPopup from './CenteredPopup';
import { useModal, useNotification } from '../hooks/useModal';

const VideoRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [userIndustry, setUserIndustry] = useState('Technology');
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState(null);
  const [showPlayback, setShowPlayback] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const [videoStartTime, setVideoStartTime] = useState(0);
  const [videoEndTime, setVideoEndTime] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoLimit, setVideoLimit] = useState(null);
  const [canRecord, setCanRecord] = useState(true);
  
  // Modal hooks
  const cameraPermissionModal = useModal();
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();

  const videoRef = useRef(null);
  const playbackVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  const navigate = useNavigate();

  // Get user industry from localStorage or context
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.industry) setUserIndustry(user.industry);
  }, []);

  // Check video limit on component mount
  useEffect(() => {
    checkVideoLimitStatus();
  }, []);

  const checkVideoLimitStatus = async () => {
    try {
      // Get default user ID (you might want to get this from authentication)
      const userId = 1; // Default user ID
      const limitData = await checkVideoLimit(userId);
      setVideoLimit(limitData);
      setCanRecord(limitData.can_record);
      
      if (!limitData.can_record) {
        showWarning(
          'Limite atteinte', 
          `Vous avez atteint la limite de ${limitData.max_videos} vidéos. Supprimez une vidéo existante pour en enregistrer une nouvelle.`
        );
      }
    } catch (error) {
      console.error('Error checking video limit:', error);
      // Allow recording by default if check fails
      setCanRecord(true);
    }
  };

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280, min: 640 }, height: { ideal: 720, min: 480 } },
        audio: true
      });
      setMediaStream(stream);
      setHasPermission(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
      showSuccess('Access granted', 'Camera and microphone activated successfully');
    } catch (err) {
      setError('Unable to access camera and microphone');
      showError('Access denied', 'Unable to access camera and microphone');
      console.error('Camera access error:', err);
    }
  }, [showSuccess, showError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
      clearInterval(countdownIntervalRef.current);
      clearInterval(recordingIntervalRef.current);
    };
  }, [mediaStream]);

  // Initialize camera on mount
  useEffect(() => { initializeCamera(); }, [initializeCamera]);

  // Handle video playback when showPlayback changes
  useEffect(() => {
    if (showPlayback && recordedBlob && playbackVideoRef.current) {
      const videoUrl = URL.createObjectURL(recordedBlob);
      playbackVideoRef.current.src = videoUrl;
      playbackVideoRef.current.load();
    }
  }, [showPlayback, recordedBlob]);

  // Countdown before recording
  const startCountdown = () => {
    // Check video limit before starting countdown
    if (!canRecord) {
      showError(
        'Limite atteinte', 
        `Vous avez atteint la limite de ${videoLimit?.max_videos || 3} vidéos. Supprimez une vidéo existante pour en enregistrer une nouvelle.`
      );
      return;
    }

    setShowCountdown(true);
    setCountdown(3);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          setShowCountdown(false);
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Start recording
  const startRecording = () => {
    if (!mediaStream) {
      setError('No media stream available');
      return;
    }
    setRecordedChunks([]);
    setShowPlayback(false);
    setRecordedBlob(null);

    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/mp4';

    const localChunks = [];
    const mediaRecorder = new MediaRecorder(mediaStream, { mimeType });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        localChunks.push(event.data);
        setRecordedChunks(prev => [...prev, event.data]);
      }
    };

    mediaRecorder.onstop = async () => {
      if (localChunks.length > 0) {
        const blob = new Blob(localChunks, { type: mimeType });
        setRecordedBlob(blob);
        setShowPlayback(true);
        
        // Create video URL for playback and ensure it loads
        const videoUrl = URL.createObjectURL(blob);
        if (playbackVideoRef.current) {
          playbackVideoRef.current.src = videoUrl;
          playbackVideoRef.current.load(); // Force load the video
          
          // Initialiser l'éditeur automatiquement après le chargement
          playbackVideoRef.current.addEventListener('loadedmetadata', () => {
            initializeVideoEditor();
          }, { once: true });
        }
      } else {
        setError('No video data recorded.');
      }
    };

    mediaRecorder.start(1000);
    setIsRecording(true);
    setRecordingTime(0);

    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= 300) { // 5 min max
          stopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  // Fonction pour obtenir la durée de la vidéo
  const getVideoDuration = (videoElement) => {
    return new Promise((resolve) => {
      if (videoElement.duration) {
        resolve(videoElement.duration);
      } else {
        videoElement.addEventListener('loadedmetadata', () => {
          resolve(videoElement.duration);
        }, { once: true });
      }
    });
  };

  // Initialiser l'éditeur vidéo
  const initializeVideoEditor = async () => {
    if (playbackVideoRef.current && recordedBlob) {
      const duration = await getVideoDuration(playbackVideoRef.current);
      setVideoDuration(duration);
      setVideoStartTime(0);
      setVideoEndTime(duration);
      setShowVideoEditor(true);
    }
  };

  // Fonctions pour l'édition vidéo
  const handleStartTimeChange = (e) => {
    const value = parseFloat(e.target.value);
    setVideoStartTime(Math.max(0, Math.min(value, videoEndTime - 1)));
  };

  const handleEndTimeChange = (e) => {
    const value = parseFloat(e.target.value);
    setVideoEndTime(Math.min(videoDuration, Math.max(value, videoStartTime + 1)));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Appliquer les modifications de coupe
  const applyVideoEdit = () => {
    if (playbackVideoRef.current && videoStartTime !== 0 || videoEndTime !== videoDuration) {
      // Ici on pourrait implémenter la logique de coupe réelle
      // Pour l'instant, on simule juste la mise à jour
      showSuccess('Video edited', 'Changes have been applied');
      setShowVideoEditor(false);
    }
  };

  // Restart recording (clear everything and return to initial state)
  const restartRecording = () => {
    stopRecording();
    setRecordingTime(0);
    setRecordedChunks([]);
    setShowPlayback(false);
    setRecordedBlob(null);
    setError(null);
    
    // Clean up video URL if it exists
    if (playbackVideoRef.current && playbackVideoRef.current.src) {
      URL.revokeObjectURL(playbackVideoRef.current.src);
    }
    
    // Reset to initial state - don't auto-start recording
    setIsRecording(false);
    setShowCountdown(false);
    setCountdown(0);
  };

  // Validate and upload recording
  const validateAndUpload = async () => {
    if (recordedBlob && recordedBlob.size > 0) {
      try {
        setIsUploading(true);
        console.log('Starting upload...', { blobSize: recordedBlob.size, blobType: recordedBlob.type });
        
        // Check file size (limit to 100MB)
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (recordedBlob.size > maxSize) {
          throw new Error('Video is too large (max 100MB)');
        }
        
        let extension = 'webm';
        if (recordedBlob.type.includes('mp4')) extension = 'mp4';
        const file = new File([recordedBlob], `video_${Date.now()}.${extension}`, { type: recordedBlob.type });
        
        console.log('File created:', { fileName: file.name, fileSize: file.size, fileType: file.type });
        
        // Add timeout to prevent hanging
        const uploadPromise = uploadVideo(file, 'draft', recordingTime);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: Upload prend trop de temps (60s)')), 60000)
        );
        
        const result = await Promise.race([uploadPromise, timeoutPromise]);
        console.log('Upload successful:', result);
        
        // Clean up
        setRecordedChunks([]);
        setRecordingTime(0);
        setIsRecording(false);
        setShowCountdown(false);
        setCountdown(0);
        setError(null);
        setShowPlayback(false);
        setRecordedBlob(null);
        
        if (playbackVideoRef.current && playbackVideoRef.current.src) {
          URL.revokeObjectURL(playbackVideoRef.current.src);
        }
        
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current = null;
        }
        
        showSuccess('Video recorded!', 'Your presentation has been saved successfully');
        setTimeout(() => {
          navigate('/my-videos');
        }, 2000);
      } catch (error) {
        console.error('Upload error:', error);
        
        // Handle specific error types
        if (error.message.includes('Timeout')) {
          setError('Server is taking too long to respond. Check your connection.');
          showError('Timeout', 'Server is taking too long to respond. Check your connection.');
        } else if (error.message.includes('Network') || error.message.includes('fetch')) {
          setError('Connection problem. Check your network.');
          showError('Network error', 'Connection problem. Check your network.');
        } else if (error.message.includes('502') || error.message.includes('Bad Gateway')) {
          setError('Server is temporarily unavailable. Please try again in a few moments.');
          showError('Server unavailable', 'Server is temporarily unavailable. Please try again in a few moments.');
        } else {
          setError('Error during recording: ' + error.message);
          showError('Recording error', error.message || 'Unable to save your video');
        }
      } finally {
        setIsUploading(false);
      }
    } else {
      setError('No video to validate. Please record a video first.');
      showWarning('No video', 'Please record a video first');
    }
  };

  // Delete recorded video
  const deleteRecordedVideo = () => {
    setRecordedChunks([]);
    setRecordingTime(0);
    setShowPlayback(false);
    setRecordedBlob(null);
    setError(null);
    
    // Clean up video URL
    if (playbackVideoRef.current && playbackVideoRef.current.src) {
      URL.revokeObjectURL(playbackVideoRef.current.src);
    }
  };


  
  // Generate QR Code
  const generateQRCode = async () => {
    setQrLoading(true);
    try {
      // Create a proper session via backend API (same as QR Generator)
      const API_BASE = process.env.REACT_APP_API_URL || 'https://192.168.1.168/api';
      const response = await fetch(`${API_BASE}/videos/sessions/create_qr_session/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setQrCodeUrl(data.url);
      setShowQRCode(true);
    } catch (error) {
      console.error('Error creating QR session:', error);
      // Fallback to simple URL if backend fails
      const fallbackUrl = window.location.origin + '/mobile-studio/session/fallback-' + Date.now();
      setQrCodeUrl(fallbackUrl);
    setShowQRCode(true);
    } finally {
      setQrLoading(false);
    }
    
    // Auto-scroll to QR code section
    setTimeout(() => {
      const qrSection = document.querySelector('.qr-code-section');
      if (qrSection) {
        qrSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 300);
  };

  // Close QR Code modal
  const closeQRCode = () => {
    setShowQRCode(false);
    setQrCodeUrl('');
  };

  return (
    <div className="main-content">
      <div className="page-header text-center">
        <h1 className="page-title">Enregistrer une vidéo</h1>
        <p className="page-subtitle">
          Préparez-vous et enregistrez votre présentation vidéo
        </p>
        {/* Instructions */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">💡 Conseils généraux</h3>
              <p className="card-subtitle">Conseils pour un bon enregistrement</p>
            </div>
            <div className="space-y-3">
              {generalInstructions.map((instruction, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-500 text-lg mt-1">•</span>
                  <span className="text-sm text-gray-700">{instruction}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">🎯 Conseils pour {userIndustry}</h3>
              <p className="card-subtitle">Conseils spécifiques à votre secteur</p>
            </div>
            <div className="space-y-3">
              {industryInstructions[userIndustry]?.map((instruction, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <span className="text-orange-500 text-lg mt-1">•</span>
                  <span className="text-sm text-gray-700">{instruction}</span>
                </div>
              )) || (
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
                  Aucun conseil spécifique disponible pour cette industrie.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Recording Section - Takes 3/5 of the space */}
          <div className="lg:col-span-3">
            <div className="card">
              <div className="card-header text-center">
                <h3 className="card-title">📹 Enregistrement Vidéo</h3>
                <p className="card-subtitle">Prévisualisation et contrôles</p>
              </div>
          
          {/* Recording Interface */}
          {!showPlayback && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-w-md h-64 mx-auto bg-gray-900 rounded-lg object-cover shadow-lg"
              />
              {showCountdown && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 rounded-lg">
                  <div className="countdown-container">
                    <div className="countdown-number">{countdown}</div>
                    <div className="countdown-text">Préparez-vous...</div>
                  </div>
                </div>
              )}
              {isRecording && (
                <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-pulse">
                  ⏺️ {formatTime(recordingTime)}
                </div>
              )}
              {isRecording && (
                <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                  🔴 Enregistrement en cours
                </div>
              )}
            </div>
          )}

          {/* Playback Interface */}
          {showPlayback && (
            <div className="relative">
              <video
                ref={playbackVideoRef}
                controls
                className="w-full max-w-md h-64 mx-auto bg-gray-900 rounded-lg object-cover shadow-lg"
              />
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-700 font-medium">Vidéo enregistrée</span>
                  <span className="text-green-600 text-sm">{formatTime(recordingTime)}</span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(recordingTime / 300) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Interface d'édition intégrée style iPhone */}
              {showVideoEditor && videoDuration > 0 && (
                <div className="mt-6 p-4 bg-white rounded-lg shadow-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">✂️ Édition Vidéo</h3>
                    <button
                      onClick={() => setShowVideoEditor(false)}
                      className="text-gray-500 hover:text-gray-700 text-xl"
                    >
                      ✕
                    </button>
                  </div>
                  
                  {/* Barre de progression avec contrôles de coupe */}
                  <div className="mb-4">
                    <div className="relative">
                      {/* Barre de progression principale */}
                      <div className="w-full h-2 bg-gray-200 rounded-full relative">
                        {/* Zone sélectionnée */}
                        <div 
                          className="absolute h-full bg-blue-500 rounded-full"
                          style={{
                            left: `${(videoStartTime / videoDuration) * 100}%`,
                            width: `${((videoEndTime - videoStartTime) / videoDuration) * 100}%`
                          }}
                        />
                        
                        {/* Poignées de début et fin */}
                        <div 
                          className="absolute w-4 h-4 bg-blue-600 rounded-full cursor-pointer transform -translate-y-1 shadow-lg"
                          style={{ left: `${(videoStartTime / videoDuration) * 100}%` }}
                        />
                        <div 
                          className="absolute w-4 h-4 bg-blue-600 rounded-full cursor-pointer transform -translate-y-1 shadow-lg"
                          style={{ left: `${(videoEndTime / videoDuration) * 100}%` }}
                        />
                      </div>
                      
                      {/* Sliders pour contrôle précis */}
                      <div className="mt-4 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Début: {formatTime(videoStartTime)}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max={videoDuration - 1}
                            step="0.1"
                            value={videoStartTime}
                            onChange={handleStartTimeChange}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fin: {formatTime(videoEndTime)}
                          </label>
                          <input
                            type="range"
                            min={videoStartTime + 1}
                            max={videoDuration}
                            step="0.1"
                            value={videoEndTime}
                            onChange={handleEndTimeChange}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Informations de la sélection */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Durée totale:</span>
                      <span className="font-semibold">{formatTime(videoDuration)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sélection:</span>
                      <span className="font-semibold text-blue-600">{formatTime(videoEndTime - videoStartTime)}</span>
                    </div>
                  </div>
                  
                  {/* Boutons d'action */}
                  <div className="flex gap-3">
                    <button
                      onClick={applyVideoEdit}
                      className="flex-1 btn btn-accent px-4 py-2 text-sm font-medium"
                    >
                      ✅ Appliquer les modifications
                    </button>
                    <button
                      onClick={() => setShowVideoEditor(false)}
                      className="flex-1 btn btn-secondary px-4 py-2 text-sm font-medium"
                    >
                      ❌ Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

            <div className="mt-6 flex flex-wrap gap-4 justify-center">
              {/* Start Recording Button */}
              {!isRecording && !showCountdown && !showPlayback && (
                <>
                  {!hasPermission ? (
                    <button
                      onClick={cameraPermissionModal.openModal}
                      className="btn btn-primary btn-lg px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      📹 Autoriser la caméra
                    </button>
                  ) : (
                    <>
                      {canRecord ? (
                        <button
                          onClick={startCountdown}
                          className="btn btn-primary btn-lg px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          🎬 Commencer l'enregistrement
                        </button>
                      ) : (
                        <button
                          disabled
                          className="btn btn-disabled btn-lg px-8 py-3 text-lg font-semibold shadow-lg transition-all duration-300 opacity-50 cursor-not-allowed"
                        >
                          🚫 Limite atteinte ({videoLimit?.video_count || 0}/{videoLimit?.max_videos || 3})
                        </button>
                      )}
                      
                      {videoLimit && (
                        <div className="text-center mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-center space-x-2 text-blue-800">
                            <span className="font-semibold">Vidéos :</span>
                            <span className="font-bold">{videoLimit.video_count}/{videoLimit.max_videos}</span>
                          </div>
                          {videoLimit.remaining_slots > 0 && (
                            <p className="text-sm text-blue-600 mt-1">
                              {videoLimit.remaining_slots} slot{videoLimit.remaining_slots > 1 ? 's' : ''} restant{videoLimit.remaining_slots > 1 ? 's' : ''}
                            </p>
                          )}
                          {!canRecord && (
                            <div className="mt-2">
                              <p className="text-sm text-red-600 mb-2 font-medium">
                                Supprimez une vidéo pour enregistrer une nouvelle
                              </p>
                              <button
                                onClick={checkVideoLimitStatus}
                                className="btn btn-sm btn-outline text-xs"
                              >
                                🔄 Vérifier à nouveau
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Generate QR Code Button */}
                  <div className="text-center">
                    <button
                      onClick={generateQRCode}
                      disabled={qrLoading}
                      className="btn btn-accent btn-lg px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {qrLoading ? '⏳ Génération...' : '📱 Studio Mobile QR'}
                    </button>
                    <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
                      Accédez au studio mobile optimisé avec détection du mode paysage
                    </p>
                  </div>
                </>
              )}


            {/* Recording Controls - Only 2 buttons as requested */}
            {isRecording && (
              <>
                <button
                  onClick={restartRecording}
                  className="btn btn-secondary px-6 py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  🔄 Recommencer
                </button>
                <button
                  onClick={stopRecording}
                  className="btn btn-warning px-6 py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  ⏹️ Arrêtez
                </button>
              </>
            )}

            {/* Playback Controls */}
            {showPlayback && (
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="flex gap-4">
                  <button
                    onClick={validateAndUpload}
                    disabled={isUploading}
                    className="btn btn-accent px-6 py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {isUploading ? '⏳ Recording...' : '✅ Validate video'}
                  </button>
                  <button
                    onClick={deleteRecordedVideo}
                    className="btn btn-secondary px-6 py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300 text-red-600 hover:bg-red-50"
                  >
                    🗑️ Supprimer
                  </button>
                </div>
                {isUploading && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="loading-spinner"></div>
                    <span>Enregistrement en cours...</span>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            </div>
            </div>
          </div>

          {/* Mobile Recording Section - Only shows when QR code is generated */}
          {showQRCode && (
            <div className="lg:col-span-2 qr-code-section">
              <div className="card">
                <div className="card-header text-center">
                  <h3 className="card-title">📱 Enregistrement Mobile</h3>
                  <p className="card-subtitle">Scannez le QR code avec votre téléphone</p>
                </div>
                
                <div className="text-center">
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="p-3 bg-white rounded-lg shadow-lg border">
                        <QRCodeSVG
                          value={qrCodeUrl}
                          size={150}
                          level="H"
                          includeMargin={true}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600">
                        Scannez ce code QR avec votre téléphone pour accéder au studio mobile
                      </p>
                      <div className="space-y-1 text-xs text-gray-400">
                        <p>• Interface mobile optimisée</p>
                        <p>• Détection automatique du mode paysage</p>
                        <p>• Enregistrement haute qualité</p>
                      </div>
                      <button
                        onClick={closeQRCode}
                        className="btn btn-secondary btn-sm w-full"
                      >
                        ✕ Fermer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recording Tips */}
        <div className="mt-6 card">
          <div className="card-header">
            <h3 className="card-title">🎥 Pendant l'enregistrement</h3>
            <p className="card-subtitle">Informations importantes</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">⏱️ Durée</h4>
              <p className="text-sm text-blue-700">Maximum 5 minutes</p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">📹 Qualité</h4>
              <p className="text-sm text-green-700">Résolution minimale 480p</p>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">🎤 Audio</h4>
              <p className="text-sm text-purple-700">Parlez clairement et naturellement</p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Modals */}
      <CameraPermissionModal
        isOpen={cameraPermissionModal.isOpen}
        onClose={cameraPermissionModal.closeModal}
        onAllow={initializeCamera}
        onDeny={cameraPermissionModal.closeModal}
      />



      <CenteredPopup
        isVisible={notification.isVisible}
        onClose={hideNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        duration={0}
        showCloseButton={true}
      />

    </div>
  );
};

export default VideoRecording;