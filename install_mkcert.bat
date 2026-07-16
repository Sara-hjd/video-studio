@echo off
echo Installing mkcert for valid local SSL certificates...

echo.
echo ========================================
echo Step 1: Downloading mkcert...
echo ========================================

REM Download mkcert for Windows
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-windows-amd64.exe' -OutFile 'mkcert.exe'"

echo.
echo ========================================
echo Step 2: Installing mkcert...
echo ========================================

REM Install mkcert
mkcert.exe -install

echo.
echo ========================================
echo Step 3: Generating valid certificates...
echo ========================================

REM Generate certificates
mkcert.exe -key-file certs/key.pem -cert-file certs/cert.pem 192.168.1.168 localhost 127.0.0.1

echo.
echo ========================================
echo mkcert installed successfully!
echo ========================================
echo.
echo ✅ Valid SSL certificates generated
echo ✅ No more browser warnings
echo ✅ Camera access guaranteed
echo.
echo You can now run: start.bat
echo.
pause 