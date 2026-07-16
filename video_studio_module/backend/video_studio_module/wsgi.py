"""
WSGI config for video_studio_module project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import os
import logging

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'video_studio_module.settings')

application = get_wsgi_application()

# Exécuter les vérifications de démarrage
try:
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from startup_checks import run_startup_checks
    run_startup_checks()
except Exception as e:
    # Logger l'erreur mais ne pas empêcher le démarrage
    logging.getLogger(__name__).error(f"Erreur lors des vérifications de démarrage: {str(e)}")
