#!/usr/bin/env python3
"""
Script pour générer des clés sécurisées pour la production
"""
import secrets
import string
import os

def generate_secret_key():
    """Génère une clé secrète Django sécurisée"""
    chars = string.ascii_letters + string.digits + '!@#$%^&*(-_=+)'
    return ''.join(secrets.choice(chars) for _ in range(50))

def generate_password(length=16):
    """Génère un mot de passe sécurisé"""
    chars = string.ascii_letters + string.digits + '!@#$%^&*'
    return ''.join(secrets.choice(chars) for _ in range(length))

def main():
    print("🔐 Génération de clés sécurisées pour la production")
    print("=" * 60)
    
    # Clé secrète Django
    secret_key = generate_secret_key()
    print(f"SECRET_KEY={secret_key}")
    print()
    
    # Mot de passe PostgreSQL
    postgres_password = generate_password(20)
    print(f"POSTGRES_PASSWORD={postgres_password}")
    print()
    
    # Configuration recommandée
    print("📝 Configuration recommandée pour .env:")
    print("-" * 40)
    print(f"SECRET_KEY={secret_key}")
    print("DEBUG=False")
    print("ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com")
    print(f"POSTGRES_PASSWORD={postgres_password}")
    print("CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com")
    print()
    
    # Sauvegarder dans un fichier
    with open('.env.production', 'w') as f:
        f.write(f"# Configuration sécurisée générée le {os.popen('date').read().strip()}\n")
        f.write(f"SECRET_KEY={secret_key}\n")
        f.write("DEBUG=False\n")
        f.write("ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com\n")
        f.write(f"POSTGRES_PASSWORD={postgres_password}\n")
        f.write("CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com\n")
        f.write("SECURE_SSL_REDIRECT=True\n")
        f.write("SECURE_HSTS_SECONDS=31536000\n")
        f.write("SECURE_HSTS_INCLUDE_SUBDOMAINS=True\n")
        f.write("SECURE_HSTS_PRELOAD=True\n")
    
    print("✅ Fichier .env.production créé avec les clés sécurisées")
    print("⚠️  IMPORTANT: Ne jamais commiter ce fichier dans Git!")

if __name__ == "__main__":
    main()
