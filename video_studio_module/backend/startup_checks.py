"""
Script de vérifications au démarrage du système
"""
import os
import logging

logger = logging.getLogger(__name__)

def run_startup_checks():
    """Exécute les vérifications au démarrage"""
    logger.info("🔍 Démarrage des vérifications système...")
    
    try:
        # Vérifier que les dossiers de logs existent
        log_files = ['debug.log', 'error.log', 'camera_errors.log', 'alerts.log']
        for log_file in log_files:
            if not os.path.exists(log_file):
                logger.info(f"📝 Création du fichier de log: {log_file}")
                with open(log_file, 'w') as f:
                    f.write(f"# Log file created at startup\n")
        
        # Vérifier les permissions d'écriture
        try:
            test_file = 'test_write_permissions.tmp'
            with open(test_file, 'w') as f:
                f.write('test')
            os.remove(test_file)
            logger.info("✅ Permissions d'écriture OK")
        except Exception as e:
            logger.error(f"❌ Problème de permissions d'écriture: {str(e)}")
        
        logger.info("✅ Vérifications de démarrage terminées")
        
    except Exception as e:
        logger.error(f"❌ Erreur lors des vérifications de démarrage: {str(e)}")