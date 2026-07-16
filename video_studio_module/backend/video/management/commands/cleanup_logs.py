"""
Commande Django pour nettoyer les logs anciens et éviter la saturation disque
"""
from django.core.management.base import BaseCommand
from django.conf import settings
import os
import glob
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Nettoie les logs anciens pour éviter la saturation disque'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Nombre de jours à conserver (défaut: 30)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Affiche ce qui serait supprimé sans supprimer'
        )
        parser.add_argument(
            '--max-size',
            type=int,
            default=100,  # MB
            help='Taille maximale des logs en MB (défaut: 100MB)'
        )

    def handle(self, *args, **options):
        days_to_keep = options['days']
        dry_run = options['dry_run']
        max_size_mb = options['max_size']
        
        self.stdout.write(
            self.style.SUCCESS(f'🧹 Nettoyage des logs - Conservation: {days_to_keep} jours, Taille max: {max_size_mb}MB')
        )
        
        if dry_run:
            self.stdout.write(self.style.WARNING('🔍 Mode simulation - Aucun fichier ne sera supprimé'))
        
        # Dossier des logs
        log_dir = os.path.dirname(os.path.abspath(__file__))
        log_dir = os.path.join(log_dir, '..', '..', '..', '..')  # Remonter au dossier backend
        
        # Fichiers de logs à nettoyer
        log_patterns = [
            'debug.log*',
            'error.log*',
            'camera_errors.log*',
            'alerts.log*',
            '*.log.*'  # Fichiers de rotation
        ]
        
        total_deleted = 0
        total_size_freed = 0
        
        for pattern in log_patterns:
            log_files = glob.glob(os.path.join(log_dir, pattern))
            
            for log_file in log_files:
                try:
                    # Vérifier l'âge du fichier
                    file_stat = os.stat(log_file)
                    file_age = datetime.now() - datetime.fromtimestamp(file_stat.st_mtime)
                    file_size_mb = file_stat.st_size / (1024 * 1024)
                    
                    should_delete = False
                    reason = ""
                    
                    # Supprimer si trop ancien
                    if file_age > timedelta(days=days_to_keep):
                        should_delete = True
                        reason = f"Trop ancien ({file_age.days} jours)"
                    
                    # Supprimer si trop volumineux
                    elif file_size_mb > max_size_mb:
                        should_delete = True
                        reason = f"Trop volumineux ({file_size_mb:.1f}MB)"
                    
                    if should_delete:
                        if dry_run:
                            self.stdout.write(
                                f"  📄 {os.path.basename(log_file)} - {reason} - {file_size_mb:.1f}MB"
                            )
                        else:
                            os.remove(log_file)
                            self.stdout.write(
                                self.style.SUCCESS(f"  ✅ Supprimé: {os.path.basename(log_file)} - {reason}")
                            )
                        
                        total_deleted += 1
                        total_size_freed += file_size_mb
                    
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f"  ❌ Erreur avec {log_file}: {str(e)}")
                    )
        
        # Résumé
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'🔍 Simulation terminée - {total_deleted} fichiers seraient supprimés ({total_size_freed:.1f}MB libérés)')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'✅ Nettoyage terminé - {total_deleted} fichiers supprimés ({total_size_freed:.1f}MB libérés)')
            )
        
        # Vérifier l'espace disque restant
        self.check_disk_space(log_dir)
    
    def check_disk_space(self, log_dir):
        """Vérifie l'espace disque disponible"""
        try:
            import shutil
            total, used, free = shutil.disk_usage(log_dir)
            free_gb = free // (1024**3)
            total_gb = total // (1024**3)
            usage_percent = (used / total) * 100
            
            if free_gb < 1:
                self.stdout.write(
                    self.style.ERROR(f'🚨 ESPACE DISQUE CRITIQUE: {free_gb}GB libre sur {total_gb}GB')
                )
            elif free_gb < 5:
                self.stdout.write(
                    self.style.WARNING(f'⚠️ Espace disque faible: {free_gb}GB libre sur {total_gb}GB')
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(f'💾 Espace disque OK: {free_gb}GB libre sur {total_gb}GB ({usage_percent:.1f}% utilisé)')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Erreur lors de la vérification de l\'espace disque: {str(e)}')
            )
