from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.viewsets import ModelViewSet
from django.http import Http404, StreamingHttpResponse
import os
import mimetypes
from .models import VideoPresentation, VideoSession
from .serializers import VideoPresentationSerializer, VideoSessionSerializer
from .error_detection import AlertManager, SystemHealthMonitor
from .video_editor import VideoEditor
import logging
import uuid

logger = logging.getLogger(__name__)
camera_logger = logging.getLogger('video.camera')
alert_logger = logging.getLogger('video.alerts')
class VideoPresentationViewSet(ModelViewSet):
    queryset = VideoPresentation.objects.all()
    serializer_class = VideoPresentationSerializer
    permission_classes = []

    def create(self, request, *args, **kwargs):
        logger.info(f"Creating new video presentation: {request.data}")
        
        try:
            # Check if user already has 3 videos
            user = request.data.get('user')
            if user:
                video_count = VideoPresentation.objects.filter(user_id=user).count()
                if video_count >= 3:
                    error_msg = 'Vous avez atteint la limite de 3 vidéos. Supprimez une vidéo existante pour en enregistrer une nouvelle.'
                    AlertManager.log_recording_error(error_msg, user_agent=request.META.get('HTTP_USER_AGENT'))
                    return Response({
                        'error': error_msg
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            response = super().create(request, *args, **kwargs)
            logger.info(f"Video created successfully: {response.data}")
            return response
                
        except Exception as e:
            error_message = f"Error creating video: {str(e)}"
            logger.error(error_message)
            logger.exception("Full traceback:")
            
            # Détecter et logger les erreurs caméra/micro
            AlertManager.log_recording_error(
                str(e), 
                user_agent=request.META.get('HTTP_USER_AGENT')
            )
            
            return Response({
                'error': 'Erreur lors de la création de la vidéo',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_queryset(self):
        # For now, return all videos until expires_at field is properly set up
        return VideoPresentation.objects.all().order_by('-created_at')

    @action(detail=False, methods=['get'])
    def check_video_limit(self, request):
        """Check if user has reached the maximum video limit (3 videos)"""
        try:
            user_id = request.GET.get('user_id')
            if not user_id:
                return Response({
                    'error': 'User ID is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            video_count = VideoPresentation.objects.filter(user_id=user_id).count()
            max_videos = 3
            
            return Response({
                'video_count': video_count,
                'max_videos': max_videos,
                'can_record': video_count < max_videos,
                'remaining_slots': max(0, max_videos - video_count)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error checking video limit: {str(e)}")
            return Response({
                'error': 'Failed to check video limit',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def request_ai_feedback(self, request, pk=None):
        try:
            video = self.get_object()
            video.ai_feedback_requested = True
            video.ai_feedback_status = 'requested'
            video.save()
            return Response({
                'message': 'AI feedback request submitted successfully',
                'video_id': video.id,
                'ai_feedback_requested': True
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Failed to request AI feedback',
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def mark_final(self, request, pk=None):
        try:
            video = self.get_object()
            
            # Si cette vidéo est déjà finale, ne rien faire
            if video.final_validated:
                return Response({
                    'message': 'Cette vidéo est déjà marquée comme finale',
                    'video_id': video.id,
                    'final_validated': True,
                    'already_final': True
                }, status=status.HTTP_200_OK)
            
            # Démarrer une transaction pour garantir la cohérence
            from django.db import transaction
            
            # Utiliser la méthode sécurisée du modèle
            video.mark_as_final()
            
            # Retourner les données mises à jour
            serializer = self.get_serializer(video)
            return Response({
                'message': 'Vidéo marquée comme finale avec succès',
                'video_id': video.id,
                'final_validated': True,
                'video': serializer.data,
                'replaced_previous': True
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error marking video as final: {str(e)}")
            return Response({
                'error': 'Erreur lors du marquage de la vidéo comme finale',
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def validate_video(self, request, pk=None):
        try:
            video = self.get_object()
            video.validated = True
            video.save()
            return Response({
                'message': 'Video validated successfully',
                'video_id': video.id,
                'validated': True
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Failed to validate video',
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    # Secure video streaming
    def file_iterator(file_obj, offset, length, chunk_size=8192):
        file_obj.seek(offset)
        remaining = length
        while remaining > 0:
            read_length = min(chunk_size, remaining)
            data = file_obj.read(read_length)
            if not data:
                break
            yield data
            remaining -= len(data)

    @action(detail=True, methods=['get'])
    def stream(self, request, pk=None):
        try:
            video = self.get_object()
            logger.info(f"Streaming request for Video ID: {video.id}")
            logger.info(f"Video Path: {video.video.path if video.video else 'None'}")
            logger.info(f"Video final_validated: {video.final_validated}")
            logger.info(f"Video status: {video.status}")
            
            if not video.video or not os.path.exists(video.video.path):
                logger.error(f"Video file not found at path: {video.video.path if video.video else 'None'}")
                raise Http404("Video file not found")
            file_path = video.video.path
            file_size = os.path.getsize(file_path)
            range_header = request.META.get('HTTP_RANGE', '').strip()
            range_match = None
            if range_header:
                import re
                range_match = re.match(r'bytes=(\d+)-(\d*)', range_header)
            content_type, _ = mimetypes.guess_type(file_path)
            if not content_type:
                content_type = 'application/octet-stream'
            f = open(file_path, 'rb')
            if range_match:
                first_byte, last_byte = range_match.groups()
                first_byte = int(first_byte)
                last_byte = int(last_byte) if last_byte else file_size - 1
                if last_byte >= file_size:
                    last_byte = file_size - 1
                length = last_byte - first_byte + 1
                response = StreamingHttpResponse(
                    VideoPresentationViewSet.file_iterator(f, first_byte, length),
                    status=206,
                    content_type=content_type
                )
                response['Content-Length'] = str(length)
                response['Content-Range'] = f'bytes {first_byte}-{last_byte}/{file_size}'
                response['Accept-Ranges'] = 'bytes'
                return response
            else:
                response = StreamingHttpResponse(
                    f,
                    content_type=content_type
                )
                response['Content-Length'] = str(file_size)
                response['Accept-Ranges'] = 'bytes'
                return response
        except Exception as e:
            error_message = f"Error streaming video: {str(e)}"
            logger.exception(error_message)
            
            # Détecter et logger les erreurs de streaming
            AlertManager.log_streaming_error(
                str(e), 
                video_id=pk,
                user_agent=request.META.get('HTTP_USER_AGENT')
            )
            raise

    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        try:
            video = self.get_object()
            new_status = request.data.get('status')
            if not new_status:
                return Response({'error': 'Status is required'}, status=status.HTTP_400_BAD_REQUEST)
            if not video.can_transition_to(new_status):
                return Response({'error': f'Cannot transition from {video.status} to {new_status}'}, status=status.HTTP_400_BAD_REQUEST)
            if new_status == 'final':
                VideoPresentation.objects.all().update(final_validated=False)
            video.set_status(new_status)
            video.save()
            return Response({
                'message': f'Video status changed to {video.status_display}',
                'video_id': video.id,
                'status': video.status,
                'statusDisplay': video.status_display
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Failed to change video status',
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def status_transitions(self, request, pk=None):
        try:
            video = self.get_object()
            transitions = []
            for status_choice in VideoPresentation.STATUS_CHOICES:
                status_code = status_choice[0]
                if video.can_transition_to(status_code):
                    transitions.append({
                        'code': status_code,
                        'label': status_choice[1]
                    })
            return Response({
                'video_id': video.id,
                'current_status': video.status,
                'current_status_display': video.status_display,
                'available_transitions': transitions
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Failed to get status transitions',
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def final_video(self, request):
        """Get the final video for a specific user or current user"""
        try:
            user_id = request.query_params.get('user_id')
            logger.info(f"Final video request - user_id: {user_id}")
            
            # If no user_id provided, try to get from request user (for authenticated users)
            if not user_id:
                if hasattr(request, 'user') and request.user.is_authenticated:
                    user_id = request.user.id
                    logger.info(f"Using authenticated user ID: {user_id}")
                else:
                    # For now, use the default user (first user in the system)
                    from django.contrib.auth.models import User
                    try:
                        default_user = User.objects.first()
                        if default_user:
                            user_id = default_user.id
                            logger.info(f"Using default user ID: {user_id}")
                        else:
                            logger.warning("No users found in the system")
                            return Response({
                                'message': 'No users found in the system'
                            }, status=status.HTTP_404_NOT_FOUND)
                    except Exception as e:
                        logger.error(f"Error getting default user: {e}")
                        return Response({
                            'error': 'user_id parameter is required or user must be authenticated'
                        }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get the final video for this user
            final_video = VideoPresentation.objects.filter(
                user_id=user_id,
                final_validated=True
            ).first()
            
            logger.info(f"Final video query result: {final_video}")
            if final_video:
                logger.info(f"Final video found - ID: {final_video.id}, Title: {final_video.title}, Status: {final_video.status}")
                logger.info(f"Video file path: {final_video.video.path if final_video.video else 'None'}")
                logger.info(f"Video file exists: {os.path.exists(final_video.video.path) if final_video.video else False}")
            
            if not final_video:
                logger.info(f"No final video found for user {user_id}")
                return Response({
                    'message': 'No final video found for this user'
                }, status=status.HTTP_404_NOT_FOUND)
            
            serializer = self.get_serializer(final_video)
            logger.info(f"Final video serialized data: {serializer.data}")
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error in final_video endpoint: {e}")
            return Response({
                'error': 'Failed to get final video',
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def video_info(self, request, pk=None):
        """Récupère les informations détaillées d'une vidéo"""
        try:
            video = self.get_object()
            
            if not video.video or not os.path.exists(video.video.path):
                return Response({
                    'error': 'Video file not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Get basic file info without FFmpeg
            file_size = os.path.getsize(video.video.path)
            file_name = os.path.basename(video.video.path)
            
            # Get video info using VideoEditor (simplified since it always returns defaults)
            editor = VideoEditor()
            actual_info = editor.get_video_info(video.video.path)
            video_info = {
                'duration': actual_info.get('duration', 300.0),
                'width': actual_info.get('width', 1280),
                'height': actual_info.get('height', 720),
                'has_audio': actual_info.get('has_audio', True),
                'format': actual_info.get('format', 'webm'),
                'size': file_size,
                'filename': file_name
            }
            
            return Response({
                'video_id': video.id,
                'video_info': video_info,
                'video_path': video.video.path,
                'video_url': video.video.url if video.video else None
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting video info: {str(e)}")
            return Response({
                'error': 'Failed to get video info',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def trim_video(self, request, pk=None):
        """Coupe le début et/ou la fin d'une vidéo avec FFmpeg"""
        try:
            video = self.get_object()
            
            if not video.video or not os.path.exists(video.video.path):
                return Response({
                    'error': 'Video file not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Récupérer les paramètres de coupe
            start_time = float(request.data.get('start_time', 0))
            end_time = request.data.get('end_time')
            if end_time is not None:
                end_time = float(end_time)
            
            # Use VideoEditor for validation and trimming
            editor = VideoEditor()
            
            # Generate output path for trimmed video
            original_path = video.video.path
            file_name, file_ext = os.path.splitext(os.path.basename(original_path))
            trimmed_filename = f"{file_name}_trimmed_{int(start_time)}_{int(end_time or 0)}{file_ext}"
            output_path = os.path.join(os.path.dirname(original_path), trimmed_filename)
            
            # Perform the actual video trimming
            trim_result = editor.trim_video(original_path, output_path, start_time, end_time)
            
            if trim_result['success']:
                # Update video record with trimmed version
                video.video = trimmed_filename
                video.save()
                
                return Response({
                    'message': 'Video trimmed successfully',
                    'video_id': video.id,
                    'trim_result': trim_result,
                    'new_video_url': video.video.url if hasattr(video.video, 'url') else None
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Video trimming failed',
                    'detail': trim_result.get('error_message', 'Unknown error')
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        except Exception as e:
            logger.error(f"Error trimming video: {str(e)}")
            AlertManager.log_recording_error(f"Erreur édition vidéo: {str(e)}")
            return Response({
                'error': 'Failed to trim video',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def validate_trim(self, request, pk=None):
        """Valide les paramètres de coupe sans effectuer l'édition"""
        try:
            video = self.get_object()
            
            if not video.video or not os.path.exists(video.video.path):
                return Response({
                    'error': 'Video file not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            start_time = float(request.data.get('start_time', 0))
            end_time = request.data.get('end_time')
            if end_time is not None:
                end_time = float(end_time)
            
            # Get actual video duration for validation
            editor = VideoEditor()
            video_info = editor.get_video_info(video.video.path)
            total_duration = video_info.get('duration', 300.0)
            
            # Validation
            if start_time < 0:
                start_time = 0
            if end_time is None:
                end_time = total_duration
            if end_time > total_duration:
                end_time = total_duration
            if start_time >= end_time:
                return Response({
                    'valid': False,
                    'error': 'Start time must be less than end time'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check that final duration is not too short
            final_duration = end_time - start_time
            if final_duration < 1.0:  # Minimum 1 second
                return Response({
                    'valid': False,
                    'error': 'Final video must be at least 1 second long'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            validation = {
                'valid': True,
                'original_duration': total_duration,
                'final_duration': final_duration,
                'start_time': start_time,
                'end_time': end_time,
                'trim_start': start_time > 0,
                'trim_end': end_time < total_duration
            }
            
            return Response(validation, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error validating trim parameters: {str(e)}")
            return Response({
                'error': 'Failed to validate trim parameters',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VideoSessionViewSet(ModelViewSet):
    """ViewSet for QR code video recording sessions"""
    queryset = VideoSession.objects.all()
    serializer_class = VideoSessionSerializer
    permission_classes = []
    lookup_field = 'session_id'
    lookup_url_kwarg = 'pk'
    
    @action(detail=False, methods=['post'])
    def create_qr_session(self, request):
        """Create a new QR code session"""
        logger.info(f"QR session creation request received from: {request.META.get('HTTP_ORIGIN', 'Unknown')}")
        logger.info(f"Request headers: {dict(request.headers)}")
        
        try:
            # Generate unique session ID
            session_id = uuid.uuid4()
            
            # Get or create default user
            from django.contrib.auth.models import User
            default_user = User.objects.first()
            if not default_user:
                default_user = User.objects.create_user(
                    username='default_user',
                    email='default@example.com',
                    password='defaultpass123'
                )
            
            # Create session
            session = VideoSession.objects.create(
                session_id=session_id,
                user=default_user
            )
            
            # Generate mobile URL - Use HTTPS domain for mobile access
            frontend_domain = "https://192.168.1.168"  # Docker HTTPS domain
            mobile_url = f"{frontend_domain}/mobile-studio/session/{session_id}"
            
            logger.info(f"Created QR session: {session_id}")
            
            return Response({
                'session_id': str(session_id),
                'url': mobile_url,
                'message': 'QR session created successfully'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating QR session: {str(e)}")
            return Response({
                'error': 'Failed to create QR session',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'], url_path='upload')
    def upload_video(self, request, pk=None):
        """Upload video for a specific session"""
        logger.info(f"=== UPLOAD VIDEO REQUEST ===")
        logger.info(f"Session ID (pk): {pk}")
        logger.info(f"Request method: {request.method}")
        logger.info(f"Content-Type: {request.content_type}")
        logger.info(f"FILES keys: {list(request.FILES.keys()) if request.FILES else 'No files'}")
        logger.info(f"POST keys: {list(request.POST.keys()) if request.POST else 'No POST data'}")
        
        # Get session by session_id (DRF handles UUID conversion automatically)
        try:
            session = self.get_object()
            logger.info(f"Session found: {session.session_id}")
        except VideoSession.DoesNotExist:
            logger.error(f"Session not found: {pk}")
            return Response({
                'error': 'Session not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error getting session: {str(e)}")
            return Response({
                'error': 'Failed to get session',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Check if video file is provided
        if 'video' not in request.FILES:
            logger.error("No video file in request.FILES")
            return Response({
                'error': 'No video file provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        video_file = request.FILES['video']
        logger.info(f"Video file: {video_file.name}, size: {video_file.size}, type: {video_file.content_type}")
        
        # Save video to session
        try:
            session.video = video_file
            session.video_ready = True
            session.save()
            logger.info(f"Video saved to session: {session.video.path}")
        except Exception as e:
            logger.error(f"Error saving video to session: {str(e)}")
            return Response({
                'error': 'Failed to save video to session',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Créer automatiquement une VideoPresentation pour que la vidéo apparaisse dans "My Videos"
        self._create_video_presentation_from_session(session, request)
        
        logger.info(f"Video uploaded for session: {pk}")
        
        return Response({
            'message': 'Video uploaded successfully',
            'session_id': str(session.session_id),
            'video_ready': True
        }, status=status.HTTP_200_OK)
    
    def _create_video_presentation_from_session(self, session, request):
        """Helper method to create VideoPresentation from session"""
        try:
            import shutil
            import os
            from django.conf import settings
            from django.contrib.auth.models import User
            
            # Chemin source (session_videos/)
            source_path = session.video.path
            logger.info(f'Source path: {source_path}')
            logger.info(f'Source exists: {os.path.exists(source_path)}')
            
            # Chemin destination (videos/)
            filename = os.path.basename(source_path)
            destination_path = os.path.join(settings.MEDIA_ROOT, 'videos', filename)
            logger.info(f'Destination path: {destination_path}')
            
            # Créer le dossier videos/ s'il n'existe pas
            os.makedirs(os.path.dirname(destination_path), exist_ok=True)
            
            # Copier le fichier
            shutil.copy2(source_path, destination_path)
            logger.info(f'File copied successfully: {destination_path}')
            logger.info(f'Destination exists: {os.path.exists(destination_path)}')
            
            # Gérer l'utilisateur - créer un utilisateur par défaut si nécessaire
            user_for_presentation = session.user
            if not user_for_presentation:
                # Créer ou récupérer un utilisateur par défaut
                user_for_presentation, created = User.objects.get_or_create(
                    username='default_user',
                    defaults={
                        'email': 'default@example.com',
                        'password': 'defaultpass123'
                    }
                )
                logger.info(f'{"Created" if created else "Retrieved"} default user: {user_for_presentation.username}')
            
            # Get duration from request data if provided
            duration_seconds = request.POST.get('duration')
            duration_value = None
            if duration_seconds:
                try:
                    from datetime import timedelta
                    duration_value = timedelta(seconds=int(float(duration_seconds)))
                    logger.info(f'Duration from mobile upload: {duration_seconds} seconds -> {duration_value}')
                except (ValueError, TypeError) as e:
                    logger.warning(f'Invalid duration value: {duration_seconds}, error: {e}')
            
            # Créer la VideoPresentation
            video_presentation = VideoPresentation.objects.create(
                user=user_for_presentation,
                video=f'videos/{filename}',
                title=f'Présentation mobile - {session.session_id}',
                comment='Vidéo enregistrée via QR code mobile',
                duration=duration_value
            )
            
            logger.info(f'VideoPresentation créée pour session {session.session_id}: {video_presentation.id}')
            logger.info(f'VideoPresentation video field: {video_presentation.video}')
            
        except Exception as e:
            logger.error(f'Erreur lors de la création de VideoPresentation: {str(e)}')
            logger.exception('Full traceback:')
            # Ne pas échouer l'upload si cette étape échoue
    
    @action(detail=True, methods=['get'], url_path='status')
    def session_status(self, request, pk=None):
        """Get status of a specific session"""
        try:
            # Get session by session_id (DRF handles UUID conversion automatically)
            session = self.get_object()
            
            return Response({
                'session_id': str(session.session_id),
                'video_ready': session.video_ready,
                'created_at': session.created_at.isoformat(),
                'has_video': bool(session.video)
            }, status=status.HTTP_200_OK)
            
        except VideoSession.DoesNotExist:
            return Response({
                'error': 'Session not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error getting session status {pk}: {str(e)}")
            return Response({
                'error': 'Failed to get session status',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SystemMonitoringViewSet(ModelViewSet):
    """ViewSet pour le monitoring du système et les alertes"""
    permission_classes = []
    
    @action(detail=False, methods=['get'])
    def health_status(self, request):
        """Retourne le statut de santé du système"""
        try:
            system_status = SystemHealthMonitor.get_system_status()
            return Response(system_status, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error getting system health status: {str(e)}")
            return Response({
                'error': 'Failed to get system health status',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def recent_alerts(self, request):
        """Retourne les alertes récentes"""
        try:
            # Lire les dernières alertes du fichier de log
            alerts_file = 'alerts.log'
            recent_alerts = []
            
            if os.path.exists(alerts_file):
                with open(alerts_file, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    # Prendre les 10 dernières lignes
                    recent_lines = lines[-10:] if len(lines) > 10 else lines
                    
                    for line in recent_lines:
                        if line.strip():
                            recent_alerts.append({
                                'log_entry': line.strip(),
                                'timestamp': line.split(']')[0].replace('[', '') if ']' in line else 'Unknown'
                            })
            
            return Response({
                'recent_alerts': recent_alerts,
                'total_alerts': len(recent_alerts)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting recent alerts: {str(e)}")
            return Response({
                'error': 'Failed to get recent alerts',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def camera_errors(self, request):
        """Retourne les erreurs de caméra récentes"""
        try:
            # Lire les erreurs de caméra du fichier de log
            camera_errors_file = 'camera_errors.log'
            recent_errors = []
            
            if os.path.exists(camera_errors_file):
                with open(camera_errors_file, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    # Prendre les 20 dernières lignes
                    recent_lines = lines[-20:] if len(lines) > 20 else lines
                    
                    for line in recent_lines:
                        if line.strip():
                            recent_errors.append({
                                'log_entry': line.strip(),
                                'timestamp': line.split(']')[0].replace('[', '') if ']' in line else 'Unknown'
                            })
            
            return Response({
                'recent_camera_errors': recent_errors,
                'total_errors': len(recent_errors)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting camera errors: {str(e)}")
            return Response({
                'error': 'Failed to get camera errors',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)