# Video Studio API Documentation

## Base URL

```
https://your-domain.com/api
```

## Authentication

Currently, the API does not require authentication for development purposes. In production, implement JWT or OAuth2 authentication.

## Response Format

All API responses follow this structure:

```json
{
  "data": {},
  "message": "Success message",
  "status": "success"
}
```

Error responses:

```json
{
  "error": "Error message",
  "detail": "Detailed error information"
}
```

## Endpoints

### Video Management

#### List All Videos

```http
GET /api/videos/
```

**Response:**
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "title": "Presentation Video",
      "status": "validated",
      "isFinal": false,
      "aiFeedbackRequested": true,
      "aiFeedbackReceived": false,
      "created_at": "2024-01-15T10:30:00Z",
      "duration": "00:05:30",
      "file_size": 52428800
    }
  ]
}
```

#### Create Video

```http
POST /api/videos/
Content-Type: multipart/form-data
```

**Request Body:**
```json
{
  "video": <file>,
  "title": "My Presentation",
  "user": 1
}
```

**Response:**
```json
{
  "id": 1,
  "title": "My Presentation",
  "status": "draft",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### Get Video Details

```http
GET /api/videos/{id}/
```

**Response:**
```json
{
  "id": 1,
  "title": "My Presentation",
  "status": "validated",
  "video": "/media/videos/video_file.webm",
  "created_at": "2024-01-15T10:30:00Z",
  "duration": "00:05:30",
  "file_size": 52428800
}
```

#### Update Video

```http
PUT /api/videos/{id}/
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "status": "validated"
}
```

#### Delete Video

```http
DELETE /api/videos/{id}/
```

**Response:** `204 No Content`

#### Validate Video

```http
POST /api/videos/{id}/validate_video/
```

**Response:**
```json
{
  "message": "Video validated successfully",
  "video_id": 1,
  "validated": true
}
```

#### Mark Video as Final

```http
POST /api/videos/{id}/mark_final/
```

**Response:**
```json
{
  "message": "Video marked as final successfully",
  "video_id": 1,
  "final_validated": true,
  "replaced_previous": true
}
```

#### Request AI Feedback

```http
POST /api/videos/{id}/request_ai_feedback/
```

**Response:**
```json
{
  "message": "AI feedback request submitted successfully",
  "video_id": 1,
  "ai_feedback_requested": true
}
```

#### Trim Video

```http
POST /api/videos/{id}/trim_video/
Content-Type: application/json
```

**Request Body:**
```json
{
  "start_time": 10.5,
  "end_time": 120.0
}
```

**Response:**
```json
{
  "message": "Video trimmed successfully",
  "video_id": 1,
  "trim_result": {
    "success": true,
    "original_duration": 300.0,
    "edited_duration": 109.5
  }
}
```

#### Validate Trim Parameters

```http
POST /api/videos/{id}/validate_trim/
Content-Type: application/json
```

**Request Body:**
```json
{
  "start_time": 10.5,
  "end_time": 120.0
}
```

**Response:**
```json
{
  "valid": true,
  "original_duration": 300.0,
  "final_duration": 109.5,
  "start_time": 10.5,
  "end_time": 120.0
}
```

#### Stream Video

```http
GET /api/videos/{id}/stream/
```

**Response:** Video stream with range request support

#### Get Video Info

```http
GET /api/videos/{id}/video_info/
```

**Response:**
```json
{
  "video_id": 1,
  "video_info": {
    "duration": 300.0,
    "width": 1280,
    "height": 720,
    "has_audio": true,
    "format": "webm",
    "size": 52428800,
    "filename": "video_file.webm"
  }
}
```

#### Change Video Status

```http
POST /api/videos/{id}/change_status/
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "final"
}
```

**Response:**
```json
{
  "message": "Video status changed to final",
  "video_id": 1,
  "status": "final",
  "statusDisplay": "Finale"
}
```

#### Get Final Video

```http
GET /api/videos/final_video/?user_id=1
```

**Response:**
```json
{
  "id": 1,
  "title": "Final Presentation",
  "status": "final",
  "final_validated": true
}
```

#### Check Video Limit

```http
GET /api/videos/check_video_limit/?user_id=1
```

**Response:**
```json
{
  "video_count": 2,
  "max_videos": 3,
  "can_record": true,
  "remaining_slots": 1
}
```

#### Get Status Transitions

```http
GET /api/videos/{id}/status_transitions/
```

**Response:**
```json
{
  "video_id": 1,
  "current_status": "draft",
  "current_status_display": "Brouillon",
  "available_transitions": [
    {
      "code": "pending",
      "label": "En attente"
    },
    {
      "code": "validated",
      "label": "Validée"
    }
  ]
}
```

### Session Management

#### Create QR Session

```http
POST /api/sessions/create_qr_session/
```

**Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://your-domain.com/mobile-studio/session/550e8400-e29b-41d4-a716-446655440000",
  "message": "QR session created successfully"
}
```

#### Upload Session Video

```http
POST /api/sessions/{session_id}/upload/
Content-Type: multipart/form-data
```

**Request Body:**
```json
{
  "video": <file>,
  "duration": 120.5
}
```

**Response:**
```json
{
  "message": "Video uploaded successfully",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "video_ready": true
}
```

#### Get Session Status

```http
GET /api/sessions/{session_id}/status/
```

**Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "video_ready": true,
  "created_at": "2024-01-15T10:30:00Z",
  "has_video": true
}
```

### System Monitoring

#### Get System Health

```http
GET /api/system/health_status/
```

**Response:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "disk_status": {
    "status": "OK",
    "free_gb": 50.5,
    "total_gb": 100.0,
    "usage_percent": 49.5,
    "message": "Espace disque OK: 50.5GB libre"
  },
  "overall_status": "OK"
}
```

#### Get Recent Alerts

```http
GET /api/system/recent_alerts/
```

**Response:**
```json
{
  "recent_alerts": [
    {
      "log_entry": "[2024-01-15 10:30:00] ALERTE CRITIQUE - Erreur caméra",
      "timestamp": "2024-01-15 10:30:00"
    }
  ],
  "total_alerts": 1
}
```

#### Get Camera Errors

```http
GET /api/system/camera_errors/
```

**Response:**
```json
{
  "recent_errors": [
    {
      "error_type": "CAMERA_DENIED",
      "message": "Accès caméra refusé",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

## Video Status Workflow

```
draft → pending → validated → final → archived
```

**Status Descriptions:**
- `draft`: Initial video recording
- `pending`: Awaiting review
- `validated`: Approved by reviewer
- `final`: Official final version
- `archived`: No longer active

## AI Feedback Status Workflow

```
not_requested → requested → processing → completed
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error type",
  "detail": "Detailed error message"
}
```

Common error types:
- `ValidationError`: Invalid input data
- `NotFoundError`: Resource not found
- `PermissionError`: Insufficient permissions
- `ServerError`: Internal server error

## Rate Limiting

Currently not implemented. Consider implementing rate limiting for production:
- 100 requests per minute per IP
- 1000 requests per hour per user

## Pagination

List endpoints support pagination:

```http
GET /api/videos/?page=2&page_size=10
```

**Response:**
```json
{
  "count": 25,
  "next": "http://api.example.com/api/videos/?page=3",
  "previous": "http://api.example.com/api/videos/?page=1",
  "results": [...]
}
```

## File Upload Limits

- Maximum file size: 100MB
- Supported formats: WebM, MP4, MOV
- Maximum videos per user: 3 (configurable)

## CORS Configuration

The API supports CORS for the following origins (configurable):
- `https://your-domain.com`
- `http://your-domain.com`
- `https://localhost`
- `http://localhost`

## Webhooks

Currently not implemented. Consider adding webhooks for:
- Video upload completion
- AI feedback completion
- System alerts

## SDK Examples

### Python

```python
import requests

API_BASE = "https://your-domain.com/api"

# Create video
files = {'video': open('video.webm', 'rb')}
data = {'title': 'My Video', 'user': 1}
response = requests.post(f"{API_BASE}/videos/", files=files, data=data)

# Get videos
response = requests.get(f"{API_BASE}/videos/")
videos = response.json()
```

### JavaScript

```javascript
const API_BASE = 'https://your-domain.com/api';

// Create video
const formData = new FormData();
formData.append('video', videoFile);
formData.append('title', 'My Video');
formData.append('user', 1);

fetch(`${API_BASE}/videos/`, {
  method: 'POST',
  body: formData
})
  .then(response => response.json())
  .then(data => console.log(data));
```

## Testing

Use the provided test endpoints for development:

```bash
# Health check
curl https://your-domain.com/api/system/health_status/

# List videos
curl https://your-domain.com/api/videos/

# Create session
curl -X POST https://your-domain.com/api/sessions/create_qr_session/
```

## Support

For API support and questions:
- Open an issue on GitHub
- Contact the development team
- Refer to the main README for general project information
