from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
import uuid
# models.py



def video_upload_path(instance, filename):
    import uuid
    return f"videos/{uuid.uuid4()}_{filename}"


def session_video_upload_path(instance, filename):
    import uuid
    return f"session_videos/{instance.session_id}_{uuid.uuid4()}_{filename}"


class VideoSession(models.Model):
    """Model for QR code video recording sessions"""
    session_id = models.UUIDField(unique=True, default=uuid.uuid4)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="video_sessions",
        null=True,
        blank=True
    )
    video = models.FileField(upload_to=session_video_upload_path, blank=True, null=True)
    video_ready = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Session {self.session_id} - Ready: {self.video_ready}"


class VideoPresentation(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Brouillon'),
        ('pending', 'En attente'),
        ('validated', 'Validée'),
        ('final', 'Finale'),
        ('archived', 'Archivée'),
    ]
    
    AI_FEEDBACK_STATUS_CHOICES = [
        ('not_requested', 'Non demandée'),
        ('requested', 'Demandée'),
        ('processing', 'En cours'),
        ('completed', 'Terminée'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="video_presentations"
    )
    title = models.CharField(max_length=255, blank=True, null=True)
    video = models.FileField(upload_to='videos/')
    created_at = models.DateTimeField(auto_now_add=True)
    uploaded_at = models.DateTimeField(blank=True, null=True)
    
    # Main status field
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft'
    )
    
    # Legacy status fields (keeping for backward compatibility)
    validated = models.BooleanField(default=False)         # Candidate clicked validate
    final_validated = models.BooleanField(default=False)   # Candidate made it "official"
    
    # AI Feedback fields
    ai_feedback_requested = models.BooleanField(default=False)
    ai_feedback_received = models.BooleanField(default=False)
    ai_feedback_status = models.CharField(
        max_length=20, 
        choices=AI_FEEDBACK_STATUS_CHOICES, 
        default='not_requested'
    )
    ai_feedback_data = models.JSONField(blank=True, null=True)  # Store AI analysis results
    
    # Video metadata
    duration = models.DurationField(blank=True, null=True)
    file_size = models.BigIntegerField(blank=True, null=True)  # File size in bytes
    resolution = models.CharField(max_length=20, blank=True, null=True)  # e.g., "1280x720"
    
    # Expiration date for automatic deletion (15 days after creation)
    expires_at = models.DateTimeField(blank=True, null=True)
    
    # Optional fields
    comment = models.TextField(blank=True, null=True)      # Optional: admin/review note
    industry = models.CharField(max_length=100, blank=True, null=True)  # User's industry

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Video {self.id} by {getattr(self.user, 'username', self.user_id)}"
    
    @property
    def is_final(self):
        """Property to match frontend 'isFinal' expectation"""
        return self.status == 'final' or self.final_validated
    
    @property
    def is_validated(self):
        """Property to match frontend 'isValidated' expectation"""
        return self.status in ['validated', 'final'] or self.validated
    
    @property
    def ai_feedback_requested_prop(self):
        """Property to match frontend 'aiFeedbackRequested' expectation"""
        return self.ai_feedback_requested
    
    @property
    def ai_feedback_received_prop(self):
        """Property to match frontend 'aiFeedbackReceived' expectation"""
        return self.ai_feedback_received
    
    @property
    def status_display(self):
        """Get human-readable status"""
        return dict(self.STATUS_CHOICES).get(self.status, self.status)
    
    def set_status(self, new_status):
        """Safely set status with validation"""
        if new_status in dict(self.STATUS_CHOICES):
            self.status = new_status
            # Update legacy fields for backward compatibility
            if new_status == 'final':
                self.final_validated = True
                self.validated = True
            elif new_status == 'validated':
                self.validated = True
                self.final_validated = False
            else:
                self.validated = False
                self.final_validated = False
            return True
        return False
    
    def can_transition_to(self, target_status):
        """Check if status transition is allowed"""
        transitions = {
            'draft': ['pending', 'validated', 'final'],
            'pending': ['validated', 'final', 'archived'],
            'validated': ['final', 'archived'],
            'final': ['archived'],
            'archived': []
        }
        return target_status in transitions.get(self.status, [])
    
    def save(self, *args, **kwargs):
        # Auto-update AI feedback status based on boolean fields
        if self.ai_feedback_requested and not self.ai_feedback_received:
            self.ai_feedback_status = 'requested'
        elif self.ai_feedback_requested and self.ai_feedback_received:
            self.ai_feedback_status = 'completed'
        elif not self.ai_feedback_requested:
            self.ai_feedback_status = 'not_requested'
        
        # Ensure status consistency with legacy fields
        if self.final_validated and self.status != 'final':
            self.status = 'final'
        elif self.validated and self.status not in ['validated', 'final']:
            self.status = 'validated'
        
        # Validation: Si cette vidéo devient finale, s'assurer qu'elle est validée
        if self.final_validated and not self.validated:
            self.validated = True
        
        super().save(*args, **kwargs)
    
    def mark_as_final(self):
        """Méthode pour marquer cette vidéo comme finale de manière sécurisée"""
        from django.db import transaction
        
        with transaction.atomic():
            # Démarrer toutes les autres vidéos du même utilisateur
            VideoPresentation.objects.filter(
                user=self.user,
                final_validated=True
            ).exclude(id=self.id).update(
                final_validated=False,
                status='validated'
            )
            
            # Marquer cette vidéo comme finale
            self.final_validated = True
            self.status = 'final'
            self.validated = True
            self.save()
    
