"""
Module de détection d'erreurs et d'alertes pour l'enregistrement vidéo
"""
import logging
import json
from datetime import datetime
from typing import Dict, List, Optional
from django.conf import settings

# Loggers spécialisés
camera_logger = logging.getLogger('video.camera')
alert_logger = logging.getLogger('video.alerts')
general_logger = logging.getLogger('video')

class CameraErrorDetector:
    """Détecteur d'erreurs de caméra et microphone"""
    
    ERROR_TYPES = {
        'CAMERA_DENIED': 'Accès caméra refusé',
        'MICROPHONE_DENIED': 'Accès microphone refusé',
        'CAMERA_NOT_FOUND': 'Caméra non trouvée',
        'MICROPHONE_NOT_FOUND': 'Microphone non trouvé',
        'RECORDING_FAILED': 'Échec de l\'enregistrement',
        'UPLOAD_FAILED': 'Échec de l\'upload',
        'STREAMING_ERROR': 'Erreur de streaming',
        'FILE_NOT_FOUND': 'Fichier vidéo non trouvé',
        'PERMISSION_ERROR': 'Erreur de permissions',
        'STORAGE_FULL': 'Espace disque insuffisant',
    }
    
    @classmethod
    def detect_camera_error(cls, error_message: str, user_agent: str = None, session_id: str = None) -> Dict:
        """
        Détecte le type d'erreur caméra/micro à partir du message d'erreur
        """
        error_message_lower = error_message.lower()
        detected_errors = []
        
        # Détection des erreurs d'accès
        if any(keyword in error_message_lower for keyword in ['camera', 'caméra', 'video']):
            if any(keyword in error_message_lower for keyword in ['denied', 'refusé', 'permission', 'blocked']):
                detected_errors.append('CAMERA_DENIED')
            elif any(keyword in error_message_lower for keyword in ['not found', 'introuvable', 'missing']):
                detected_errors.append('CAMERA_NOT_FOUND')
        
        if any(keyword in error_message_lower for keyword in ['microphone', 'micro', 'audio']):
            if any(keyword in error_message_lower for keyword in ['denied', 'refusé', 'permission', 'blocked']):
                detected_errors.append('MICROPHONE_DENIED')
            elif any(keyword in error_message_lower for keyword in ['not found', 'introuvable', 'missing']):
                detected_errors.append('MICROPHONE_NOT_FOUND')
        
        # Détection des erreurs d'enregistrement
        if any(keyword in error_message_lower for keyword in ['recording', 'enregistrement', 'record']):
            if any(keyword in error_message_lower for keyword in ['failed', 'échec', 'error', 'erreur']):
                detected_errors.append('RECORDING_FAILED')
        
        # Détection des erreurs d'upload
        if any(keyword in error_message_lower for keyword in ['upload', 'téléchargement']):
            if any(keyword in error_message_lower for keyword in ['failed', 'échec', 'error', 'erreur']):
                detected_errors.append('UPLOAD_FAILED')
        
        # Détection des erreurs de streaming
        if any(keyword in error_message_lower for keyword in ['stream', 'streaming']):
            if any(keyword in error_message_lower for keyword in ['failed', 'échec', 'error', 'erreur']):
                detected_errors.append('STREAMING_ERROR')
        
        # Détection des erreurs de fichier
        if any(keyword in error_message_lower for keyword in ['file not found', 'fichier introuvable']):
            detected_errors.append('FILE_NOT_FOUND')
        
        # Détection des erreurs de permissions
        if any(keyword in error_message_lower for keyword in ['permission', 'permissions', 'access denied']):
            detected_errors.append('PERMISSION_ERROR')
        
        # Détection des erreurs d'espace disque
        if any(keyword in error_message_lower for keyword in ['no space', 'espace insuffisant', 'disk full']):
            detected_errors.append('STORAGE_FULL')
        
        return {
            'detected_errors': detected_errors,
            'error_message': error_message,
            'user_agent': user_agent,
            'session_id': session_id,
            'timestamp': datetime.now().isoformat(),
            'severity': cls._get_severity(detected_errors)
        }
    
    @classmethod
    def _get_severity(cls, errors: List[str]) -> str:
        """Détermine la sévérité basée sur les erreurs détectées"""
        if not errors:
            return 'INFO'
        
        critical_errors = ['CAMERA_DENIED', 'MICROPHONE_DENIED', 'STORAGE_FULL']
        warning_errors = ['CAMERA_NOT_FOUND', 'MICROPHONE_NOT_FOUND', 'RECORDING_FAILED', 'UPLOAD_FAILED']
        
        if any(error in critical_errors for error in errors):
            return 'CRITICAL'
        elif any(error in warning_errors for error in errors):
            return 'WARNING'
        else:
            return 'ERROR'

class AlertManager:
    """Gestionnaire d'alertes pour les erreurs critiques"""
    
    @classmethod
    def log_camera_error(cls, error_data: Dict):
        """Enregistre une erreur de caméra/micro"""
        error_types = error_data.get('detected_errors', [])
        severity = error_data.get('severity', 'ERROR')
        
        # Log détaillé
        log_message = f"Erreur caméra/micro détectée: {', '.join(error_types)} - {error_data.get('error_message', '')}"
        
        if severity == 'CRITICAL':
            camera_logger.critical(log_message, extra={
                'error_data': error_data,
                'error_types': error_types,
                'session_id': error_data.get('session_id'),
                'user_agent': error_data.get('user_agent')
            })
            # Déclencher une alerte critique
            cls.trigger_critical_alert(error_data)
        elif severity == 'WARNING':
            camera_logger.warning(log_message, extra={
                'error_data': error_data,
                'error_types': error_types
            })
        else:
            camera_logger.error(log_message, extra={
                'error_data': error_data,
                'error_types': error_types
            })
    
    @classmethod
    def trigger_critical_alert(cls, error_data: Dict):
        """Déclenche une alerte critique"""
        alert_message = f"ALERTE CRITIQUE - Erreur caméra/micro: {', '.join(error_data.get('detected_errors', []))}"
        
        alert_logger.critical(alert_message, extra={
            'alert_type': 'CAMERA_MICRO_ERROR',
            'error_data': error_data,
            'timestamp': datetime.now().isoformat(),
            'requires_attention': True
        })
        
        # Log dans le fichier général aussi
        general_logger.critical(f"🚨 {alert_message}")
    
    @classmethod
    def log_recording_error(cls, error_message: str, session_id: str = None, user_agent: str = None):
        """Enregistre une erreur d'enregistrement"""
        error_data = CameraErrorDetector.detect_camera_error(error_message, user_agent, session_id)
        cls.log_camera_error(error_data)
        return error_data
    
    @classmethod
    def log_upload_error(cls, error_message: str, session_id: str = None, user_agent: str = None):
        """Enregistre une erreur d'upload"""
        error_data = CameraErrorDetector.detect_camera_error(error_message, user_agent, session_id)
        cls.log_camera_error(error_data)
        return error_data
    
    @classmethod
    def log_streaming_error(cls, error_message: str, video_id: int = None, user_agent: str = None):
        """Enregistre une erreur de streaming"""
        error_data = CameraErrorDetector.detect_camera_error(error_message, user_agent, f"video_{video_id}")
        cls.log_camera_error(error_data)
        return error_data

class SystemHealthMonitor:
    """Moniteur de santé du système"""
    
    @classmethod
    def check_disk_space(cls) -> Dict:
        """Vérifie l'espace disque disponible"""
        import shutil
        
        try:
            total, used, free = shutil.disk_usage(settings.MEDIA_ROOT)
            free_gb = free // (1024**3)
            total_gb = total // (1024**3)
            usage_percent = (used / total) * 100
            
            if free_gb < 1:  # Moins de 1GB libre
                alert_logger.critical(f"Espace disque critique: {free_gb}GB libre sur {total_gb}GB")
                return {
                    'status': 'CRITICAL',
                    'free_gb': free_gb,
                    'total_gb': total_gb,
                    'usage_percent': usage_percent,
                    'message': f'Espace disque critique: {free_gb}GB libre'
                }
            elif free_gb < 5:  # Moins de 5GB libre
                alert_logger.warning(f"Espace disque faible: {free_gb}GB libre sur {total_gb}GB")
                return {
                    'status': 'WARNING',
                    'free_gb': free_gb,
                    'total_gb': total_gb,
                    'usage_percent': usage_percent,
                    'message': f'Espace disque faible: {free_gb}GB libre'
                }
            else:
                return {
                    'status': 'OK',
                    'free_gb': free_gb,
                    'total_gb': total_gb,
                    'usage_percent': usage_percent,
                    'message': f'Espace disque OK: {free_gb}GB libre'
                }
        except Exception as e:
            alert_logger.error(f"Erreur lors de la vérification de l'espace disque: {str(e)}")
            return {
                'status': 'ERROR',
                'message': f'Erreur de vérification: {str(e)}'
            }
    
    @classmethod
    def get_system_status(cls) -> Dict:
        """Retourne le statut général du système"""
        disk_status = cls.check_disk_space()
        
        return {
            'timestamp': datetime.now().isoformat(),
            'disk_status': disk_status,
            'overall_status': disk_status['status']
        }
