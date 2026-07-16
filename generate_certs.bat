@echo off
echo Generating SSL certificates for local HTTPS development...

REM Create certs directory
if not exist "certs" mkdir certs

REM Check if mkcert is available
where mkcert >nul 2>&1
if %errorlevel% equ 0 (
    echo Using mkcert to generate certificates...
    mkcert -install
    mkcert -key-file certs/key.pem -cert-file certs/cert.pem 192.168.1.168 localhost 127.0.0.1
) else (
    echo mkcert not found. Using OpenSSL fallback...
    REM Try to use Docker to generate certificates
    docker run --rm -v %cd%/certs:/certs alpine/openssl req -x509 -newkey rsa:4096 -keyout /certs/key.pem -out /certs/cert.pem -days 365 -nodes -subj "/C=FR/ST=State/L=City/O=Organization/CN=192.168.1.168" -addext "subjectAltName=DNS:192.168.1.168,DNS:localhost,DNS:127.0.0.1,IP:192.168.1.168,IP:127.0.0.1"
)

echo.
echo ========================================
echo SSL certificates generated!
echo ========================================
echo Certificate: certs/cert.pem
echo Private Key: certs/key.pem
echo.
echo You can now use HTTPS for camera access.
echo.
pause 