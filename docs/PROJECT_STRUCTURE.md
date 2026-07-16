# Project Structure

```
video-studio-main/
├── README.md                          # Main project documentation
├── LICENSE                            # MIT License
├── .gitignore                         # Git ignore rules
├── .env.example                       # Environment variables template
├── docker-compose.yml                 # Docker orchestration configuration
├── nginx.conf                         # Nginx reverse proxy configuration
├── start.bat                          # Windows startup script
├── generate_certs.bat                 # SSL certificate generation (Windows)
├── install_mkcert.bat                 # mkcert installation (Windows)
├── generate_secure_keys.py            # Security key generation script
├── DEPENDENCIES.md                    # Dependencies documentation
├── CONTRIBUTING.md                    # Contribution guidelines
├── CHANGELOG.md                       # Version history
├── CODE_OF_CONDUCT.md                 # Community guidelines
│
├── docs/                              # Documentation directory
│   ├── API.md                         # API documentation
│   ├── PROJECT_STRUCTURE.md           # This file
│   └── images/                        # Screenshots and images
│       ├── home-page.png
│       ├── video-recording.png
│       ├── video-editor.png
│       └── mobile-studio.png
│
└── video_studio_module/               # Main application directory
    ├── backend/                       # Django backend
    │   ├── Dockerfile                 # Backend Docker image
    │   ├── manage.py                  # Django management script
    │   ├── requirements.txt           # Python dependencies
    │   ├── startup_checks.py          # Startup validation script
    │   │
    │   ├── video/                     # Main Django app
    │   │   ├── __init__.py
    │   │   ├── admin.py               # Django admin configuration
    │   │   ├── apps.py                # App configuration
    │   │   ├── models.py              # Database models
    │   │   ├── views.py               # API viewsets
    │   │   ├── serializers.py         # DRF serializers
    │   │   ├── urls.py                # URL routing
    │   │   ├── tests.py               # Test cases
    │   │   ├── permissions.py         # Custom permissions
    │   │   ├── analytics.py           # Analytics module
    │   │   ├── video_editor.py        # FFmpeg video processing
    │   │   ├── error_detection.py     # Error monitoring system
    │   │   │
    │   │   ├── management/            # Django management commands
    │   │   │   ├── __init__.py
    │   │   │   └── commands/
    │   │   │       ├── __init__.py
    │   │   │       ├── cleanup_logs.py
    │   │   │       └── cleanup_expired_videos.py
    │   │   │
    │   │   └── migrations/            # Database migrations
    │   │       ├── __init__.py
    │   │       ├── 0001_initial.py
    │   │       ├── 0002_videosession.py
    │   │       └── 0003_alter_videosession_session_id.py
    │   │
    │   └── video_studio_module/       # Django project settings
    │       ├── __init__.py
    │       ├── settings.py            # Project configuration
    │       ├── urls.py                # Root URL configuration
    │       ├── wsgi.py                # WSGI configuration
    │       └── asgi.py                # ASGI configuration
    │
    └── video-frontend/                # React frontend
        ├── Dockerfile                 # Frontend Docker image
        ├── package.json               # Node.js dependencies
        ├── package-lock.json          # Dependency lock file
        ├── http-server.json           # HTTP server configuration
        │
        ├── public/                    # Static assets
        │   └── index.html
        │
        └── src/                       # Source code
            ├── index.js               # React entry point
            ├── index.css              # Global styles
            ├── App.js                 # Main React component
            │
            ├── api/                    # API client
            │   └── api.js              # Axios configuration
            │
            ├── hooks/                  # Custom React hooks
            │   └── useVideoRecorder.js
            │
            ├── data/                   # Static data
            │   └── constants.js        # Application constants
            │
            └── components/             # React components
                ├── Home.jsx            # Home page
                ├── Upload.jsx          # File upload
                ├── Feedback.jsx        # AI feedback interface
                ├── VideoRecording.jsx  # Recording interface
                ├── MyVideos.jsx        # Video management
                ├── VideoProfile.jsx    # Video details
                ├── VideoEditor.jsx     # Video editing
                ├── VideoTimeline.jsx   # Timeline component
                ├── VideoPlayer.jsx     # Video player
                ├── VideoThumbnail.jsx  # Thumbnail generator
                ├── QRGenerator.jsx     # QR code generator
                ├── MobileStudio.jsx    # Mobile recording
                ├── MobileNavbar.jsx    # Mobile navigation
                ├── Navbar.jsx          # Desktop navigation
                ├── SystemAlerts.jsx    # System monitoring
                ├── CameraPermissionModal.jsx
                ├── CenteredPopup.jsx
                ├── ConfirmationModal.jsx
                ├── CustomModal.jsx
                ├── ModalManager.jsx
                ├── NotificationToast.jsx
                └── instructions.jsx
```

## Directory Descriptions

### Root Level
- **Configuration files**: Docker, Nginx, environment setup
- **Documentation**: README, license, contribution guidelines
- **Scripts**: Startup and certificate generation

### Backend (`video_studio_module/backend/`)
- **Django application**: REST API with video processing
- **Video app**: Core business logic for video management
- **Management commands**: Maintenance and cleanup tasks

### Frontend (`video_studio_module/video-frontend/`)
- **React application**: User interface and client-side logic
- **Components**: Modular React components for different features
- **API client**: HTTP communication with backend

### Documentation (`docs/`)
- **API documentation**: Complete API reference
- **Project structure**: This file
- **Images**: Screenshots and diagrams

## Key Files

### Configuration
- `docker-compose.yml` - Service orchestration
- `nginx.conf` - Reverse proxy configuration
- `.env.example` - Environment variables template

### Backend
- `requirements.txt` - Python dependencies
- `manage.py` - Django management
- `settings.py` - Django configuration

### Frontend
- `package.json` - Node.js dependencies
- `App.js` - Main React component
- `index.js` - React entry point

## Data Flow

```
User → React Frontend → Django API → PostgreSQL
                    ↓
                 FFmpeg (video processing)
                    ↓
              File Storage (media/)
```

## Service Ports

- **Frontend**: 3000
- **Backend**: 8000
- **PostgreSQL**: 5432
- **Nginx**: 80 (HTTP), 443 (HTTPS)
