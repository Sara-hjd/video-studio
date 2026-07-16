# Video Studio

[![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg)](https://www.docker.com/)
[![Django](https://img.shields.io/badge/Django-5.2-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A professional video recording and management platform designed for presentations, interviews, and content creation. Features advanced video editing, AI-powered feedback integration, mobile support via QR codes, and comprehensive system monitoring.

## Overview

Video Studio addresses the need for a comprehensive, enterprise-grade video recording solution that bridges the gap between desktop and mobile recording workflows. In today's remote work and digital content creation landscape, professionals require tools that enable seamless video capture across devices with robust management capabilities.

This application was developed to provide:
- **Cross-platform recording**: Desktop and mobile video capture with synchronized workflows
- **Professional video management**: Status-based video lifecycle (draft → pending → validated → final → archived)
- **Advanced editing capabilities**: FFmpeg-powered video trimming and processing
- **System reliability**: Comprehensive error detection, monitoring, and alerting
- **Mobile accessibility**: QR code-based mobile recording sessions

**Target users**: Content creators, HR professionals conducting interviews, educators recording presentations, and organizations requiring structured video workflows.

## Features

### Core Functionality
- **Video Recording**: High-quality video capture with camera and microphone access
- **Multi-Platform Support**: Desktop and mobile recording capabilities
- **Video Status Management**: Draft → Pending → Validated → Final → Archived workflow
- **File Organization**: UUID-based file naming and organized storage
- **Video Limits**: Configurable per-user video limits (default: 3 videos)

### Video Editing
- **Inline Video Trimming**: iPhone-style trimming interface with visual sliders
- **Precision Controls**: Frame-accurate start/end time selection
- **Real-time Preview**: Live preview of trimmed segments
- **Validation System**: Automatic validation of trim parameters
- **FFmpeg Integration**: Professional video processing backend

### Mobile Integration
- **QR Code Generation**: Instant mobile access via QR code scanning
- **Session Management**: Unique session IDs for mobile recordings
- **Cross-Platform Sync**: Seamless synchronization between desktop and mobile
- **Responsive Design**: Optimized mobile interface

### AI Features (Interface Ready)
- **AI Feedback System**: Request and receive AI analysis of presentations
- **Status Tracking**: Real-time AI processing status monitoring
- **Data Storage**: JSON-based AI analysis results storage
- **Feedback Workflow**: Not Requested → Requested → Processing → Completed

### System Monitoring
- **Error Detection**: Intelligent camera/microphone error detection
- **Health Monitoring**: System resource and performance monitoring
- **Alert Management**: Critical system alerts and notifications
- **Log Management**: Advanced logging with automatic rotation
- **Disk Space Monitoring**: Automatic cleanup and space management

### Security
- **HTTPS/SSL**: Full SSL/TLS encryption for all communications
- **CORS Configuration**: Secure cross-origin resource sharing
- **File Security**: Secure file upload and storage
- **Access Control**: Configurable permissions

## Technologies Used

| Category | Technologies |
|----------|--------------|
| Frontend | React 18, React Router, Axios, react-webcam, qrcode.react, html5-qrcode |
| Backend | Django 5.2, Django REST Framework |
| Database | PostgreSQL 15 |
| Video Processing | FFmpeg, OpenCV, MoviePy |
| Containerization | Docker, Docker Compose |
| Web Server | Nginx (Reverse Proxy) |
| Security | SSL/TLS, CORS Headers |
| Development | Python 3.11, Node.js 18 |

## Architecture

Video Studio follows a microservices-inspired architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERNET / USERS                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    NGINX (Reverse Proxy)                   │
│  • Port 80 (HTTP)  • Port 443 (HTTPS)                     │
│  • SSL/TLS         • Load Balancing                        │
│  • Static Files    • React Router Support                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──────┐ ┌───▼────┐ ┌──────▼──────┐
│   FRONTEND   │ │ BACKEND│ │   POSTGRES   │
│   (React)    │ │(Django)│ │ (Database)   │
│   Port 3000  │ │Port 8000│ │  Port 5432  │
└──────────────┘ └────────┘ └─────────────┘
```

### Component Communication

**Frontend (React.js)**
- SPA architecture with React Router for navigation
- MediaRecorder API for browser-based video capture
- Axios for API communication with backend
- QR code generation for mobile sessions

**Backend (Django REST Framework)**
- RESTful API with ViewSets for CRUD operations
- FFmpeg integration for video processing
- OpenCV for computer vision tasks
- Comprehensive error detection and logging
- Session management for mobile recordings

**Database (PostgreSQL)**
- Relational data modeling for videos and sessions
- JSON field storage for AI feedback data
- Optimized for video metadata and user management

**Infrastructure**
- Docker Compose for service orchestration
- Nginx as reverse proxy with SSL termination
- Volume management for persistent data storage

## Project Structure

```
video-studio-main/
├── docker-compose.yml              # Docker orchestration
├── nginx.conf                      # Nginx configuration
├── start.bat                       # Windows startup script
├── generate_certs.bat              # SSL certificate generation
├── video_studio_module/
│   ├── backend/
│   │   ├── Dockerfile
│   │   ├── manage.py
│   │   ├── requirements.txt
│   │   ├── video/                  # Django app
│   │   │   ├── models.py           # Database models
│   │   │   ├── views.py            # API viewsets
│   │   │   ├── serializers.py      # DRF serializers
│   │   │   ├── urls.py             # URL routing
│   │   │   ├── video_editor.py     # FFmpeg video processing
│   │   │   ├── error_detection.py  # Error monitoring
│   │   │   └── management/         # Django management commands
│   │   └── video_studio_module/    # Django project settings
│   └── video-frontend/
│       ├── Dockerfile
│       ├── package.json
│       ├── public/
│       └── src/
│           ├── App.js              # Main React component
│           ├── api/                 # API client
│           ├── components/         # React components
│           │   ├── Home.jsx
│           │   ├── VideoRecording.jsx
│           │   ├── MyVideos.jsx
│           │   ├── VideoEditor.jsx
│           │   ├── QRGenerator.jsx
│           │   ├── MobileStudio.jsx
│           │   └── SystemAlerts.jsx
│           └── hooks/              # Custom React hooks
└── README.md
```

## Installation

### Prerequisites

- **Docker Desktop** (latest version)
- **4GB+ RAM** available
- **10GB+ free disk space** (for videos and logs)
- **Network access** for SSL certificates

### Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd video-studio-main
```

2. **Generate SSL certificates**
```bash
# Windows
generate_certs.bat

# Linux/Mac
chmod +x generate_certs.sh
./generate_certs.sh
```

3. **Configure IP address**
Update your machine's IP address in the following files:
- `docker-compose.yml` (lines 25-26, 47)
- `nginx.conf` (lines 20, 75)
- `video_studio_module/backend/video_studio_module/settings.py` (line 28)

4. **Start the application**
```bash
# Windows
start.bat

# Linux/Mac
docker-compose up -d
```

5. **Access the application**
- Desktop: `https://<your-ip>`
- Mobile: Scan the generated QR code

### Manual Installation

1. **Environment Setup**
```bash
# Create environment file
cp .env.example .env
nano .env
```

2. **Database Setup**
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser (optional)
docker-compose exec backend python manage.py createsuperuser
```

3. **Start All Services**
```bash
docker-compose up -d
```

## Configuration

### Environment Variables

Key environment variables in `docker-compose.yml`:

```yaml
# Django Configuration
DEBUG=True
ALLOWED_HOSTS=<your-ip>,localhost,127.0.0.1

# Database Configuration
DATABASE_URL=postgresql://videostudio:videostudio123@postgres:5432/video_studio
POSTGRES_PASSWORD=videostudio123

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://<your-ip>,http://<your-ip>

# Frontend Configuration
REACT_APP_API_URL=https://<your-ip>/api
```

### PostgreSQL Configuration

- **Database**: `video_studio`
- **User**: `videostudio`
- **Password**: `videostudio123` (default - change in production)
- **Port**: 5432

### Docker Configuration

- **Backend Port**: 8000
- **Frontend Port**: 3000
- **PostgreSQL Port**: 5432
- **Nginx Ports**: 80 (HTTP), 443 (HTTPS)

### SSL Configuration

SSL certificates are auto-generated using mkcert:
- Located in `./certs/` directory
- Used by Nginx for HTTPS
- Regenerate with `generate_certs.bat` if needed

## Running the Project

### Starting All Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Individual Services

```bash
# Start specific service
docker-compose up -d backend

# Restart service
docker-compose restart backend

# Access service shell
docker-compose exec backend bash
```

### Database Management

```bash
# Access PostgreSQL
docker-compose exec postgres psql -U videostudio -d video_studio

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser
```

### Maintenance Commands

```bash
# Clean old logs (prevent disk saturation)
docker-compose exec backend python manage.py cleanup_logs --days 30

# Delete expired videos (15+ days)
docker-compose exec backend python manage.py cleanup_expired_videos

# Check disk space
docker system df
```

## API Endpoints

### Video Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/videos/` | List all videos |
| POST | `/api/videos/` | Create new video |
| GET | `/api/videos/{id}/` | Get video details |
| PUT | `/api/videos/{id}/` | Update video |
| DELETE | `/api/videos/{id}/` | Delete video |
| POST | `/api/videos/{id}/validate_video/` | Mark video as validated |
| POST | `/api/videos/{id}/mark_final/` | Mark video as final |
| POST | `/api/videos/{id}/request_ai_feedback/` | Request AI analysis |
| POST | `/api/videos/{id}/trim_video/` | Trim video |
| POST | `/api/videos/{id}/validate_trim/` | Validate trim parameters |
| GET | `/api/videos/{id}/stream/` | Stream video file |
| GET | `/api/videos/{id}/video_info/` | Get video metadata |
| POST | `/api/videos/{id}/change_status/` | Change video status |
| GET | `/api/videos/final_video/` | Get user's final video |
| GET | `/api/videos/check_video_limit/` | Check video limit |

### Session Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions/create_qr_session/` | Create QR session |
| POST | `/api/sessions/{id}/upload/` | Upload session video |
| GET | `/api/sessions/{id}/status/` | Get session status |

### System Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/system/health_status/` | Get system health |
| GET | `/api/system/recent_alerts/` | Get recent alerts |
| GET | `/api/system/camera_errors/` | Get camera errors |

## Screenshots

*Note: Screenshots should be added to demonstrate the application's interface and functionality.*

- **Home Page**: Main dashboard with recording options
- **Video Recording Interface**: Camera and microphone controls
- **My Videos Dashboard**: Video management and status display
- **Video Editor**: Trimming interface with timeline
- **QR Code Generator**: Mobile session creation
- **Mobile Studio**: Mobile recording interface
- **System Alerts**: Monitoring dashboard

## Future Improvements

### Planned Features
- **Advanced Video Editing**: Add filters, transitions, and multi-track editing
- **Real AI Integration**: Connect to actual AI services for presentation analysis
- **User Authentication**: Implement proper authentication system (JWT/OAuth)
- **Multi-user Support**: Enhanced user management and permissions
- **Cloud Storage**: Integration with S3 or similar cloud storage
- **Video Compression**: Automatic video compression for storage optimization
- **Analytics Dashboard**: Usage statistics and performance metrics
- **Collaboration Features**: Sharing and commenting on videos
- **Advanced AI Features**: Real-time feedback during recording

### Technical Improvements
- **Redis Caching**: Implement caching layer for improved performance
- **Load Balancing**: Horizontal scaling support
- **Automated Testing**: Comprehensive unit and integration tests
- **CI/CD Pipeline**: Automated deployment workflows
- **Monitoring Integration**: Prometheus/Grafana for advanced monitoring
- **Database Optimization**: Query optimization and indexing

## Skills Demonstrated

### Full-Stack Development
- React.js SPA development with hooks and context
- Django REST Framework API design and implementation
- PostgreSQL database modeling and optimization
- State management in React applications

### Video Processing
- FFmpeg integration for video editing and processing
- OpenCV for computer vision tasks
- MediaRecorder API for browser-based recording
- Video streaming and range request handling

### System Architecture
- Microservices-inspired architecture design
- Docker containerization and orchestration
- Nginx reverse proxy configuration
- SSL/TLS certificate management

### DevOps & Infrastructure
- Docker Compose multi-service orchestration
- Volume management for persistent data
- Health checks and service monitoring
- Log management and rotation

### Security & Reliability
- CORS configuration and security headers
- Error detection and alerting systems
- Input validation and file upload security
- System health monitoring

### API Design
- RESTful API design principles
- ViewSets and serializers in Django REST Framework
- Custom actions and endpoints
- Error handling and logging

### Mobile Development
- Responsive design patterns
- QR code integration for mobile access
- Cross-platform video recording
- Mobile-optimized UI components

## Author

**Developed by Sara Hajdaoui & Adnane Habbaz**

A collaborative project showcasing modern full-stack development practices, video processing capabilities, and enterprise-grade system architecture.

**Repository**: https://github.com/adnane1949/-video-studio

**License**: MIT License - see LICENSE file for details

---

Built with ❤️ for professional video recording and management
