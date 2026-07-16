@echo off
echo ========================================
echo Video Studio - Plateforme d'Enregistrement
echo ========================================

echo.
echo Verifying SSL certificates...
if not exist "certs\cert.pem" (
    echo SSL certificates not found. Generating them...
    call generate_certs.bat
)

echo.
echo Starting Video Studio with Docker...
docker-compose up --build -d

echo.
echo ========================================
echo Video Studio is starting up!
echo ========================================
echo.
echo Frontend: https://192.168.1.168
echo Backend API: https://192.168.1.168/api
echo.
echo Waiting for services to be ready...
timeout /t 15 /nobreak > nul

echo.
echo ✅ Services are running!
echo.
echo 📱 Desktop: Open https://192.168.1.168
echo 📱 Mobile: Scan QR code from desktop app
echo.
echo 🔧 Useful commands:
echo    - View logs: docker-compose logs -f
echo    - Stop app: docker-compose down
echo    - Restart: docker-compose restart
echo.
pause 