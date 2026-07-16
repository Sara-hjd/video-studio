from rest_framework import serializers
from .models import VideoPresentation, VideoSession
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'industry')

class VideoPresentationSerializer(serializers.ModelSerializer):
    # Properties to match frontend expectations
    isFinal = serializers.BooleanField(source='is_final', read_only=True)
    isValidated = serializers.BooleanField(source='is_validated', read_only=True)
    aiFeedbackRequested = serializers.BooleanField(source='ai_feedback_requested_prop', read_only=True)
    aiFeedbackReceived = serializers.BooleanField(source='ai_feedback_received_prop', read_only=True)
    
    # New status fields
    statusDisplay = serializers.CharField(source='status_display', read_only=True)
    canTransitionTo = serializers.SerializerMethodField()
    
    # Format duration for frontend
    duration = serializers.SerializerMethodField()
    
    class Meta:
        model = VideoPresentation
        fields = [
            'id', 'user', 'title', 'video', 'created_at', 'uploaded_at',
            'status', 'statusDisplay', 'canTransitionTo',
            'validated', 'final_validated', 'duration', 'comment',
            'ai_feedback_requested', 'ai_feedback_received', 'ai_feedback_status',
            'ai_feedback_data', 'file_size', 'resolution', 'industry',
            # Frontend-compatible properties
            'isFinal', 'isValidated', 'aiFeedbackRequested', 'aiFeedbackReceived'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'uploaded_at', 'file_size', 'expires_at']

    def get_duration(self, obj):
        """Format duration as MM:SS for frontend"""
        if obj.duration:
            total_seconds = int(obj.duration.total_seconds())
            minutes = total_seconds // 60
            seconds = total_seconds % 60
            return f"{minutes:02d}:{seconds:02d}"
        return None
    
    def get_canTransitionTo(self, obj):
        """Get available status transitions for frontend"""
        available_transitions = []
        for status_choice in VideoPresentation.STATUS_CHOICES:
            status_code = status_choice[0]
            if obj.can_transition_to(status_code):
                available_transitions.append({
                    'code': status_code,
                    'label': status_choice[1]
                })
        return available_transitions
    
    def to_representation(self, instance):
        """Retourner les données normalement"""
        return super().to_representation(instance)

    def create(self, validated_data):
        # Handle user creation more robustly
        if 'user' not in validated_data or not validated_data['user']:
            from django.contrib.auth.models import User
            try:
                # Try to get the first user in the system
                default_user = User.objects.first()
                if not default_user:
                    # Create a default user if none exists
                    default_user = User.objects.create_user(
                        username='default_user',
                        email='default@example.com',
                        password='defaultpass123'
                    )
                validated_data['user'] = default_user
            except Exception as e:
                # If user creation fails, log the error and continue
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error creating default user: {e}")
                # Don't fail the video upload if user creation fails
                pass
        
        # Handle duration conversion from seconds to DurationField
        if 'duration' in validated_data:
            duration_value = validated_data['duration']
            if isinstance(duration_value, (int, float, str)):
                try:
                    from datetime import timedelta
                    validated_data['duration'] = timedelta(seconds=int(float(duration_value)))
                except (ValueError, TypeError) as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f'Invalid duration value: {duration_value}, error: {e}')
                    # Remove invalid duration
                    validated_data.pop('duration', None)
        
        return VideoPresentation.objects.create(**validated_data)


class VideoSessionSerializer(serializers.ModelSerializer):
    """Serializer for VideoSession model"""
    
    class Meta:
        model = VideoSession
        fields = [
            'session_id', 'user', 'video', 'video_ready', 'created_at'
        ]
        read_only_fields = ['session_id', 'created_at', 'video_ready']