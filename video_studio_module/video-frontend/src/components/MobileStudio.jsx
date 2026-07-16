import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { uploadVideo } from '../api/video';

const MobileStudio = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState(null);
  const [showPlayback, setShowPlayback] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
     const [isUploading, setIsUploading] = useState(false);
   const [uploadSuccess, setUploadSuccess] = useState(false);
   const [uploadProgress, setUploadProgress] = useState(0);
   const [showLandscapePopup, setShowLandscapePopup] = useState(false);
   const [orientation, setOrientation] = useState('portrait');

  const videoRef = useRef(null);
  const playbackVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  // API_BASE pour accès mobile via Docker HTTPS
  const API_BASE = process.env.REACT_APP_API_URL || 'https://192.168.1.168/api';

  // Check device orientation
  const checkOrientation = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;
    
    setOrientation(isLandscape ? 'landscape' : 'portrait');
    
    // Show popup if in portrait mode and user hasn't dismissed it yet
    if (!isLandscape && !localStorage.getItem('landscapePopupDismissed')) {
      setShowLandscapePopup(true);
    } else if (isLandscape) {
      setShowLandscapePopup(false);
    }
  };

  // Dismiss landscape popup
  const dismissLandscapePopup = () => {
    setShowLandscapePopup(false);
    localStorage.setItem('landscapePopupDismissed', 'true');
  };

     // Initialize camera on mount
   useEffect(() => {
     initializeCamera();
     
     // Check orientation and show popup if needed
     checkOrientation();
     
     // Listen for orientation changes
     const handleOrientationChange = () => {
       setTimeout(checkOrientation, 100); // Small delay to ensure orientation is updated
     };
     
     window.addEventListener('orientationchange', handleOrientationChange);
     window.addEventListener('resize', handleOrientationChange);
     
           // Auto-reload video after 2 seconds if not visible
      const autoReloadTimer = setTimeout(() => {
        if (videoRef.current && !videoRef.current.srcObject) {
          console.log('🔄 Auto-reload video after 2 seconds');
          initializeCamera();
        }
      }, 2000);
     
     return () => {
       clearTimeout(autoReloadTimer);
       window.removeEventListener('orientationchange', handleOrientationChange);
       window.removeEventListener('resize', handleOrientationChange);
       if (mediaStream) {
         mediaStream.getTracks().forEach(track => track.stop());
       }
       clearInterval(countdownIntervalRef.current);
       clearInterval(recordingIntervalRef.current);
       
       // Clean up video URLs
       if (playbackVideoRef.current && playbackVideoRef.current.src) {
         URL.revokeObjectURL(playbackVideoRef.current.src);
       }
     };
   }, []);

  // Initialize camera - Configuration universelle
  const initializeCamera = async () => {
    console.log('🎥 Attempting camera access...');
    console.log('🌐 Browser detected:', navigator.userAgent);
    console.log('🔒 HTTPS:', window.location.protocol === 'https:');
    console.log('📱 MediaDevices supported:', !!navigator.mediaDevices);
    console.log('📹 getUserMedia supported:', !!navigator.mediaDevices?.getUserMedia);
    
    try {
      // Vérifier les permissions d'abord
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'camera' });
        console.log('📋 Camera permission:', permission.state);
        
        if (permission.state === 'denied') {
          throw new Error('Camera permission denied by user');
        }
      }

      // Configuration progressive pour tous les navigateurs
      let constraints = {
        video: { 
          width: { ideal: 720, min: 480 }, 
          height: { ideal: 480, min: 320 },
          facingMode: 'user'
        },
        audio: true
      };

      // Détection du navigateur pour optimiser
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      
      console.log('📱 Détection:', { isIOS, isSafari, isAndroid });
      
      if (isIOS || isSafari) {
        // Configuration optimisée pour Safari/iOS
        constraints.video = {
          width: { ideal: 720, min: 480 },
          height: { ideal: 480, min: 320 },
          facingMode: 'user'
        };
        console.log('📱 Configuration Safari/iOS appliquée');
      } else if (isAndroid) {
        // Configuration pour Android
        constraints.video = {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user'
        };
        console.log('🤖 Configuration Android appliquée');
      }

      console.log('🎯 Contraintes finales:', constraints);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Accès caméra réussi !', stream);
      console.log('📹 Tracks:', stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
      
      setMediaStream(stream);
      setHasPermission(true);
      setError(null);
      
             if (videoRef.current) {
         // Nettoyer d'abord
         videoRef.current.srcObject = null;
         
         // Assigner le nouveau stream
         videoRef.current.srcObject = stream;
         
         // Configuration pour tous les navigateurs mobiles
         videoRef.current.setAttribute('playsinline', true);
         videoRef.current.setAttribute('autoplay', true);
         videoRef.current.setAttribute('muted', true);
         videoRef.current.setAttribute('controls', false);
         
         // Forcer le chargement
         videoRef.current.load();
         
         // Attendre que la vidéo soit prête
         videoRef.current.onloadedmetadata = () => {
           // Vérifier que videoRef.current existe encore
           if (!videoRef.current) {
             console.log('📹 VideoRef est null, arrêt du callback');
             return;
           }
           
           console.log('📹 Vidéo metadata chargée:', {
             videoWidth: videoRef.current.videoWidth || 0,
             videoHeight: videoRef.current.videoHeight || 0,
             readyState: videoRef.current.readyState
           });
           
           // Attendre un peu plus avant de forcer la lecture
           setTimeout(() => {
             const playVideo = async () => {
               // Vérifier à nouveau que videoRef.current existe
               if (!videoRef.current) {
                 console.log('📹 VideoRef est null lors de la lecture');
                 return;
               }
               
               try {
                 await videoRef.current.play();
                 console.log('✅ Lecture vidéo démarrée avec succès');
               } catch (e) {
                 console.log('📹 Lecture automatique échouée (normal sur mobile):', e);
                 // Essayer de nouveau après un délai
                 setTimeout(() => {
                   if (videoRef.current) {
                   videoRef.current.play().catch(e2 => {
                     console.log('📹 Deuxième tentative échouée:', e2);
                   });
                   }
                 }, 1000);
               }
             };
             
             playVideo();
           }, 500); // Attendre 500ms pour que la vidéo soit vraiment prête
         };
        
        // Événements pour debug
        videoRef.current.oncanplay = () => {
          if (videoRef.current) {
          console.log('📹 Vidéo peut être lue');
          }
        };
        
        videoRef.current.onerror = (e) => {
          if (videoRef.current) {
          console.error('📹 Erreur vidéo:', e);
          }
        };
        
        console.log('📹 Stream assigné au video element');
      }
    } catch (err) {
      console.error('❌ Erreur accès caméra:', err);
      console.error('❌ Détails erreur:', {
        name: err.name,
        message: err.message,
        constraint: err.constraint
      });
      
      let errorMessage = `Impossible d'accéder à la caméra: ${err.name}`;
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Permission refusée. Veuillez autoriser l\'accès à la caméra et au microphone.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'Aucune caméra trouvée sur cet appareil.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Votre navigateur ne supporte pas l\'accès à la caméra.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'La caméra est déjà utilisée par une autre application.';
      }
      
      setError(errorMessage);
    }
  };

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

  // Start recording - Même logique que VideoRecording.jsx
  const startRecording = () => {
    console.log('🎬 Démarrage enregistrement...');
    console.log('📹 MediaStream disponible:', !!mediaStream);
    console.log('📹 Tracks actives:', mediaStream?.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
    
    if (!mediaStream) {
      console.error('❌ Pas de stream média');
      setError('Aucun flux média disponible');
      return;
    }

    console.log('📹 Stream disponible, initialisation...');
    setRecordedChunks([]);
    setShowPlayback(false);
    setRecordedBlob(null);

    // Même logique de détection de codec que VideoRecording.jsx
    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/mp4';
    
    console.log('🎥 Type MIME sélectionné:', mimeType);
    console.log('🌐 Navigateur:', navigator.userAgent.includes('Safari') ? 'Safari' : 
                                navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                                navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Autre');

    try {
      const localChunks = [];
      const mediaRecorder = new MediaRecorder(mediaStream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        console.log('📊 Données reçues:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          localChunks.push(event.data);
          setRecordedChunks(prev => {
            const newChunks = [...prev, event.data];
            console.log('💾 Total chunks:', newChunks.length);
            return newChunks;
          });
        } else {
          console.warn('⚠️ Chunk vide reçu');
        }
      };

      mediaRecorder.onstart = () => {
        console.log('🎬 MediaRecorder démarré avec succès');
      };

      mediaRecorder.onerror = (event) => {
        console.error('❌ Erreur MediaRecorder:', event);
        setError(`Erreur d'enregistrement: ${event.error}`);
      };

             mediaRecorder.onstop = async () => {
         console.log('⏹️ Enregistrement arrêté, chunks:', localChunks.length);
         if (localChunks.length > 0) {
           const blob = new Blob(localChunks, { type: mimeType });
           console.log('🎥 Blob créé:', blob.size, 'bytes, type:', blob.type);
           setRecordedBlob(blob);
           setShowPlayback(true);
           
           // ARRÊTER LE STREAM POUR ÉVITER L'AUDIO EN RETARD
           if (videoRef.current && videoRef.current.srcObject) {
             const tracks = videoRef.current.srcObject.getTracks();
             tracks.forEach(track => {
               track.stop();
               console.log('🛑 Track arrêtée:', track.kind);
             });
             videoRef.current.srcObject = null;
           }
           
           // Create video URL for playback
           const videoUrl = URL.createObjectURL(blob);
           if (playbackVideoRef.current) {
             playbackVideoRef.current.src = videoUrl;
             playbackVideoRef.current.load();
             console.log('📹 URL vidéo créée:', videoUrl);
           }
         } else {
           console.error('❌ Aucun chunk enregistré');
           setError('Aucune donnée vidéo enregistrée.');
         }
       };

      console.log('🎬 Démarrage MediaRecorder...');
      mediaRecorder.start(100); // Reduced from 1000ms to 100ms for smoother progress
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer - more frequent updates for smoother progress bar
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 300) { // 5 min max comme VideoRecording.jsx
            stopRecording();
            return prev;
          }
          return prev + 0.1; // Increment by 0.1 seconds for smoother progress
        });
      }, 100); // Update every 100ms instead of 1000ms
      
      console.log('✅ Enregistrement démarré avec succès');
      
    } catch (err) {
      console.error('❌ Erreur lors du démarrage de l\'enregistrement:', err);
      setError(`Erreur lors du démarrage de l'enregistrement: ${err.message}`);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
      
      // Nettoyer les event listeners pour éviter les erreurs
      if (videoRef.current) {
        videoRef.current.onloadedmetadata = null;
        videoRef.current.oncanplay = null;
        videoRef.current.onerror = null;
      }
    }
  };

  // Upload video - Utiliser l'endpoint session pour mobile
  const uploadMobileVideo = async () => {
    if (!recordedBlob || recordedBlob.size === 0) {
      setError('Aucune vidéo à uploader');
      return;
    }

         setIsUploading(true);
     setError(null);
     setUploadProgress(0);

     try {
       console.log('Starting mobile upload...', { blobSize: recordedBlob.size, blobType: recordedBlob.type });
       
       // Créer le fichier
       let extension = 'webm';
       if (recordedBlob.type.includes('mp4')) extension = 'mp4';
       const file = new File([recordedBlob], `mobile_video_${Date.now()}.${extension}`, {
         type: recordedBlob.type
       });
       
       console.log('File created:', { fileName: file.name, fileSize: file.size, fileType: file.type });

       // Utiliser l'endpoint session pour mobile
       const formData = new FormData();
       formData.append('video', file);
       formData.append('duration', recordingTime.toString());

       // Simuler la progression pendant l'upload
       const progressInterval = setInterval(() => {
         setUploadProgress(prev => {
           if (prev >= 90) return prev;
           return prev + Math.random() * 10;
         });
       }, 500);

       // Timeout pour éviter que l'upload reste bloqué
       const controller = new AbortController();
       const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 secondes max
       
       const response = await fetch(`${API_BASE}/videos/sessions/${sessionId}/upload/`, {
         method: 'POST',
         body: formData,
         signal: controller.signal
       });
       
       clearTimeout(timeoutId);

       clearInterval(progressInterval);
       setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('Mobile upload successful:', result);
      
             setUploadSuccess(true);
       
       // Clean up
       setRecordedChunks([]);
       setRecordingTime(0);
       setIsRecording(false);
       setShowCountdown(false);
       setCountdown(0);
       setError(null);
       setShowPlayback(false);
       setRecordedBlob(null);
       setUploadProgress(0);
       
       if (playbackVideoRef.current && playbackVideoRef.current.src) {
         URL.revokeObjectURL(playbackVideoRef.current.src);
       }
       
       if (mediaRecorderRef.current) {
         mediaRecorderRef.current = null;
       }
       
       // Show success message for a few seconds then redirect
       setTimeout(() => {
         navigate('/');
       }, 3000);

    } catch (err) {
      console.error('Mobile upload error:', err);
      setError(`Erreur lors de l'upload: ${err.message}`);
         } finally {
       setIsUploading(false);
       setUploadProgress(0);
     }
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (uploadSuccess) {
    return (
      <div className="mobile-studio min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Vidéo envoyée !</h2>
          <p className="text-green-600 mb-4">
            Votre vidéo a été uploadée avec succès.
          </p>
          <p className="text-sm text-green-500">
            Redirection automatique...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`mobile-studio min-h-screen bg-gray-100 ${orientation === 'landscape' ? 'landscape-mode' : ''}`}>
      {/* Landscape Orientation Popup */}
      {showLandscapePopup && (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 bg-opacity-95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 transform animate-bounce-in">
            <div className="text-center">
              {/* Phone Rotation Animation */}
              <div className="mb-8">
                <div className="relative mx-auto w-20 h-28 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center shadow-2xl">
                  <div className="text-white text-3xl">📱</div>
                  <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 text-3xl animate-spin">
                    🔄
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 opacity-20 animate-pulse"></div>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                📐 Optimisation Vidéo
              </h3>
              
              <p className="text-gray-700 mb-6 text-base leading-relaxed">
                Pour une <strong className="text-blue-600">qualité vidéo optimale</strong> et une compatibilité parfaite avec les enregistrements desktop, 
                <strong className="text-purple-600"> retournez votre téléphone en mode paysage</strong> avant d'enregistrer.
              </p>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">💡</div>
                  <div>
                    <p className="text-blue-800 text-sm font-medium mb-1">Pourquoi cette recommandation ?</p>
                    <p className="text-blue-700 text-xs leading-relaxed">
                      Cela garantit que votre vidéo aura exactement la même taille et qualité que les enregistrements desktop.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={dismissLandscapePopup}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl font-semibold text-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  ✅ Compris
                </button>
                <button
                  onClick={() => {
                    dismissLandscapePopup();
                    // Try to lock orientation to landscape (if supported)
                    if (screen.orientation && screen.orientation.lock) {
                      screen.orientation.lock('landscape').catch(() => {
                        console.log('Orientation lock not supported');
                      });
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl font-semibold text-sm hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  🔄 Basculer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">📱 Studio Mobile</h1>
          <p className="text-blue-100 text-sm">
          Session: {sessionId?.substring(0, 8)}...
        </p>
          {orientation === 'portrait' && (
            <div className="mt-3 inline-flex items-center bg-orange-500 bg-opacity-20 text-orange-100 px-3 py-1 rounded-full text-xs">
              💡 Recommandé: Mode paysage pour une meilleure qualité
            </div>
          )}
          {orientation === 'landscape' && (
            <div className="mt-3 inline-flex items-center bg-green-500 bg-opacity-20 text-green-100 px-3 py-1 rounded-full text-xs">
              ✅ Mode paysage activé - Qualité optimale
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

                 {!hasPermission && (
           <div className="text-center py-8">
             <div className="text-4xl mb-4">📹</div>
             <h3 className="text-lg font-medium mb-2">Accès caméra requis</h3>
             <p className="text-gray-600 mb-4">
               Autorisez l'accès à votre caméra et microphone pour commencer.
             </p>
             <button
               onClick={initializeCamera}
               className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium"
             >
               Autoriser l'accès
             </button>
           </div>
         )}

        {hasPermission && (
          <div className={`space-y-4 ${orientation === 'landscape' ? 'max-w-4xl mx-auto' : ''}`}>
            {/* Video Preview */}
            <div className={`relative bg-black rounded-lg overflow-hidden ${orientation === 'landscape' ? 'mx-auto' : ''}`}>
                             {!showPlayback ? (
                 <video
                   ref={videoRef}
                   autoPlay
                   muted
                   playsInline
                   className={`w-full object-cover ${orientation === 'landscape' ? 'h-64' : 'h-80'}`}
                   style={{ 
                     transform: 'scaleX(-1)', // Mirror effect
                     aspectRatio: orientation === 'landscape' ? '16/9' : '9/16'
                   }}
                   onLoadedData={() => {
                     console.log('📹 Video loaded data event fired');
                     if (videoRef.current) {
                       videoRef.current.play().catch(e => console.log('Play on loadedData failed:', e));
                     }
                   }}
                   onCanPlay={() => {
                     console.log('📹 Video can play event fired');
                     if (videoRef.current) {
                       videoRef.current.play().catch(e => console.log('Play on canPlay failed:', e));
                     }
                   }}
                 />
               ) : (
                <video
                  ref={playbackVideoRef}
                  controls
                  playsInline
                  className={`w-full object-cover ${orientation === 'landscape' ? 'h-64' : 'h-80'}`}
                  style={{ 
                     aspectRatio: orientation === 'landscape' ? '16/9' : '9/16'
                   }}
                />
              )}

              {/* Countdown Overlay */}
              {showCountdown && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 rounded-lg">
                  <div className="countdown-container">
                    <div className="countdown-number">{countdown}</div>
                    <div className="countdown-text">Préparez-vous...</div>
                  </div>
                </div>
              )}

              {/* Recording Indicator */}
              {isRecording && (
                <>
                  <div className="absolute top-4 left-4 flex items-center bg-red-600 bg-opacity-80 px-3 py-1 rounded-full">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse mr-2"></div>
                    <span className="text-white font-medium text-sm">
                      REC {formatTime(recordingTime)}
                    </span>
                  </div>
                  
                  {/* Recording Border */}
                  <div className="absolute inset-0 border-4 border-red-500 border-opacity-50 rounded-lg animate-pulse"></div>
                  
                  {/* Recording Text */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-600 bg-opacity-80 px-4 py-2 rounded-full">
                    <span className="text-white font-medium text-sm">
                      🎬 Enregistrement en cours...
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Controls */}
            <div className="space-y-3">
              {!isRecording && !showPlayback && (
                <button
                  onClick={startCountdown}
                  disabled={showCountdown}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  {showCountdown ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Démarrage...
                    </div>
                  ) : (
                    '🎬 Commencer l\'enregistrement'
                  )}
                </button>
              )}

              {isRecording && (
                <>
                  {/* Recording Progress Bar */}
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(recordingTime / 300) * 100}%` }}
                    ></div>
                  </div>
                  
                  {/* Recording Info */}
                  <div className="text-center text-sm text-gray-600">
                    {formatTime(recordingTime)} / 05:00
                  </div>
                  
                  <button
                    onClick={stopRecording}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-xl font-bold text-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
                  >
                    ⏹️ Arrêter l'enregistrement
                  </button>
                </>
              )}

              {showPlayback && !isUploading && (
                <div className="space-y-3">
                  <button
                    onClick={uploadMobileVideo}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
                  >
                    ✅ Valider et envoyer
                  </button>
                                     <button
                     onClick={() => {
                       setShowPlayback(false);
                       setRecordedBlob(null);
                       setRecordedChunks([]);
                       if (playbackVideoRef.current && playbackVideoRef.current.src) {
                         URL.revokeObjectURL(playbackVideoRef.current.src);
                       }
                       
                       // Redémarrer la caméra
                       if (mediaStream) {
                         // Arrêter l'ancien stream
                         mediaStream.getTracks().forEach(track => track.stop());
                         
                         // Réinitialiser la caméra
                         setTimeout(() => {
                           initializeCamera();
                         }, 100);
                       }
                     }}
                     className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-xl font-semibold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
                   >
                     🔄 Recommencer
                   </button>
                </div>
              )}

                             {isUploading && (
                 <div className="space-y-3">
                   <div className="w-full bg-blue-500 text-white py-4 rounded-lg font-medium text-lg text-center">
                     ⏳ Upload en cours... {Math.round(uploadProgress)}%
                   </div>
                   
                   {/* Progress Bar */}
                   <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                     <div 
                       className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                       style={{ width: `${uploadProgress}%` }}
                     ></div>
                   </div>
                   
                   <div className="text-center text-sm text-gray-600">
                     Envoi de votre vidéo au serveur...
                   </div>
                 </div>
               )}
            </div>

            {/* Instructions */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-5 shadow-lg">
              <h4 className="font-bold text-blue-800 mb-4 text-lg flex items-center gap-2">
                💡 Conseils pour un enregistrement parfait
              </h4>
              <ul className="text-sm text-blue-700 space-y-3">
                <li className={`flex items-center gap-3 p-2 rounded-lg ${orientation === 'landscape' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                  <span className="text-lg">{orientation === 'landscape' ? '✅' : '📐'}</span>
                  <span className="font-medium">
                    {orientation === 'landscape' ? 'Mode paysage activé' : 'Recommandé: Mode paysage'} pour une meilleure qualité
                  </span>
                </li>
                <li className="flex items-center gap-3 p-2 rounded-lg bg-blue-100">
                  <span className="text-lg">💡</span>
                  <span>Assurez-vous d'avoir un bon éclairage</span>
                </li>
                <li className="flex items-center gap-3 p-2 rounded-lg bg-blue-100">
                  <span className="text-lg">🎤</span>
                  <span>Parlez clairement face à la caméra</span>
                </li>
                <li className="flex items-center gap-3 p-2 rounded-lg bg-blue-100">
                  <span className="text-lg">📱</span>
                  <span>Gardez le téléphone stable pendant l'enregistrement</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileStudio;