# Dependencies Documentation

## Backend Dependencies (Python)

### Core Framework
- **Django==5.2.4** - Web framework
- **djangorestframework==3.16.0** - REST API toolkit
- **django-cors-headers==4.7.0** - CORS support

### Database
- **psycopg2-binary==2.9.9** - PostgreSQL adapter

### Video Processing
- **ffmpeg-python==0.2.0** - FFmpeg Python bindings
- **opencv-python==4.8.1.78** - Computer vision library
- **moviepy==1.0.3** - Video editing library

### Utilities
- **Pillow==10.1.0** - Image processing
- **python-decouple==3.8** - Configuration management

### Installation
```bash
pip install -r video_studio_module/backend/requirements.txt
```

## Frontend Dependencies (Node.js)

### Core Framework
- **react-scripts^5.0.1** - React build toolchain
- **react-router-dom^7.7.0** - Routing library

### HTTP & API
- **axios^1.11.0** - HTTP client
- **http-proxy-middleware^3.0.5** - Proxy configuration

### Video & Camera
- **react-webcam^7.2.0** - Webcam component
- **html5-qrcode^2.3.8** - QR code scanner

### UI Components
- **qrcode.react^4.2.0** - QR code generator

### Installation
```bash
cd video_studio_module/video-frontend
npm install
```

## Docker Dependencies

### Services
- **postgres:15** - PostgreSQL database
- **nginx:alpine** - Reverse proxy
- Custom Docker images for backend and frontend

### Installation
```bash
docker-compose build
```

## System Dependencies

### Required Software
- **Docker Desktop** (latest version)
- **FFmpeg** (included in Docker image)
- **Node.js 18+** (for local development)
- **Python 3.11+** (for local development)

## Notes

- All dependencies are pinned to specific versions for reproducibility
- PostgreSQL is provided via Docker for development
- FFmpeg is included in the backend Docker image
- No additional system dependencies required when using Docker
