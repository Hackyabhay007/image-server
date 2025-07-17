# Image & Media Server

A powerful Node.js Express server for uploading, compressing, serving, and managing images, videos, audio, PDFs, and document files. Features a modern web dashboard with authentication, API key protection, and comprehensive file management capabilities.

## 🚀 Features

### Core Functionality
- **Multi-format Support**: Images, videos, audio, PDFs, documents
- **Image Compression**: JPEG optimization using ImageFlow
- **Video Compression**: FFmpeg-powered video processing
- **Flexible File Serving**: Direct access via `/image/:filename`, `/video/:filename`, etc.
- **Download Endpoints**: Secure file downloads with proper headers
- **File Management**: Upload, delete, preview, and share functionality

### Web Dashboard
- **Modern UI**: Clean, responsive dashboard interface
- **Authentication System**: Secure admin login with session management
- **File Browser**: Advanced search, filtering, and sorting capabilities
- **Drag & Drop Upload**: Intuitive file upload interface
- **Real-time Updates**: Live file management and status updates

### API & Security
- **API Key Authentication**: Secure API access with bearer tokens
- **CORS Support**: Cross-origin resource sharing enabled
- **Environment Configuration**: Flexible deployment options
- **Session Management**: 24-hour authentication sessions

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **FFmpeg** (for video compression)
- **npm** or **yarn**

### FFmpeg Installation

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH.

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd image-server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
```bash
# Copy the example environment file
cp env.example .env

# Edit the configuration
nano .env
```

### 4. Configure Environment Variables
```env
# Server Configuration
PORT=3000
NODE_ENV=production
CURRENT_ENV=PRODUCTION

# API Configuration
API_KEYS=your-secure-api-key-here
BASE_URL=https://your-domain.com

# Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
SESSION_TIMEOUT=86400000
ENABLE_AUTH=true
```

### 5. Create Upload Directories
```bash
mkdir -p uploads/images uploads/video uploads/audio uploads/pdf uploads/docs
```

### 6. Start the Server
```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

## 🐳 Docker Deployment

### Quick Start with Docker
```bash
# Build and run with Docker Compose
docker compose up -d

# Access the application
# Dashboard: http://localhost:3001/dashboard
# Login: http://localhost:3001/login
```

For detailed Docker instructions, see [DOCKER_README.md](./DOCKER_README.md).

## 🌐 Web Interface

### Access Points
- **Dashboard**: `http://localhost:3000/dashboard`
- **Login**: `http://localhost:3000/login`
- **Root**: `http://localhost:3000/` (redirects to login)

### Default Credentials
- **Username**: `admin`
- **Password**: `admin123`

### Dashboard Features
- **File Upload**: Drag & drop or click to browse
- **File Management**: View, download, delete, share files
- **Search & Filter**: Find files by name, type, or date
- **Sorting**: Sort by newest, oldest, name, size, or type
- **Pagination**: Navigate through large file collections
- **Real-time Updates**: Live file status and progress

## 🔌 API Reference

### Authentication
All API endpoints (except direct file access) require authentication:
```http
Authorization: Bearer your-api-key
```

### File Upload

#### Upload Image with Compression
```http
POST /upload/image/:quality?
Content-Type: multipart/form-data

FormData:
- image: [file]
```

**Parameters:**
- `:quality` (optional): JPEG quality 1-100 (default: 80)

**Response:**
```
image/filename.jpg
```

#### Upload Video
```http
POST /upload/video
Content-Type: multipart/form-data

FormData:
- video: [file]
```

**Response:**
```
video/compressed-filename.mp4
```

#### Universal Media Upload
```http
POST /media/upload/:type
Content-Type: multipart/form-data

FormData:
- [any field name]: [file]
- fordownload: true (optional)
```

**Parameters:**
- `:type`: `image`, `video`, `audio`, `pdf`, or `doc`
- `fordownload`: Returns download URL instead of direct access URL

**Response:**
```json
{
  "url": "https://your-domain.com/type/filename.ext"
}
```

### File Access

#### Direct File Access (No Authentication Required)
```http
GET /image/:filename
GET /video/:filename
GET /audio/:filename
GET /pdf/:filename
GET /doc/:filename
```

#### Download Files (Authentication Required)
```http
GET /download/:type/:filename
```

**Parameters:**
- `:type`: `image`, `video`, `audio`, `pdf`, or `doc`
- `:filename`: URL-encoded filename

### File Management

#### List All Media
```http
GET /media?page=1&limit=10&sort=newest&type=image,video,audio,pdf,doc
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sort`: `newest`, `oldest`, `name`, `size`, `type`
- `type`: File type filter (comma-separated or `all`)

**Response:**
```json
{
  "files": [
    {
      "name": "example.jpg",
      "type": "image",
      "size": 1024000,
      "uploadDate": "2024-01-15T10:30:00Z",
      "url": "/image/example.jpg",
      "downloadUrl": "/download/image/example.jpg"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10
  }
}
```

#### List by Type
```http
GET /images?page=1&limit=10&sort=newest
GET /videos?page=1&limit=10&sort=newest
GET /audio?page=1&limit=10&sort=newest
GET /pdfs?page=1&limit=10&sort=newest
GET /docs?page=1&limit=10&sort=newest
```

#### Delete File
```http
DELETE /delete/:type/:filename
```

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully",
  "deletedPath": "uploads/images/example.jpg"
}
```

## 📁 File Structure

```
image-server/
├── index.js                 # Main server file
├── package.json            # Dependencies and scripts
├── .env                    # Environment configuration
├── env.example            # Environment template
├── uploads/               # File storage directory
│   ├── images/           # Image files
│   ├── video/            # Video files
│   ├── audio/            # Audio files
│   ├── pdf/              # PDF files
│   └── docs/             # Document files
├── ui/                   # Web dashboard files
│   ├── dashboard.html    # Main dashboard
│   ├── dashboard.css     # Dashboard styles
│   ├── dashboard.js      # Dashboard logic
│   ├── login.html        # Login page
│   ├── login.css         # Login styles
│   ├── login.js          # Login logic
│   └── config.js         # UI configuration
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose setup
└── README.md            # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `API_KEYS` | Comma-separated API keys | `5d92b8f69c9dda89f38c10fa6750376a25b53a9afd47e74951104769630d4ccc` |
| `BASE_URL` | External service URL | `https://storage.cmsil.org` |
| `ADMIN_USERNAME` | Dashboard admin username | `admin` |
| `ADMIN_PASSWORD` | Dashboard admin password | `admin123` |
| `SESSION_TIMEOUT` | Session timeout (ms) | `86400000` (24h) |
| `ENABLE_AUTH` | Enable authentication | `true` |
| `CURRENT_ENV` | Environment identifier | `PRODUCTION` |

### Supported File Types

**Images:** JPG, JPEG, PNG, GIF, WebP, BMP, TIFF
**Videos:** MP4, AVI, MOV, WebM, MKV, FLV, WMV
**Audio:** MP3, WAV, AAC, OGG, FLAC, M4A
**Documents:** PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
**Others:** TXT, RTF, CSV, ZIP, RAR

## 🚀 Usage Examples

### JavaScript/Node.js

#### Upload an Image
```javascript
const formData = new FormData();
formData.append("image", imageFile);

const response = await fetch("https://your-server/upload/image/90", {
  method: "POST",
  headers: {
    Authorization: "Bearer your-api-key",
  },
  body: formData,
});

const imagePath = await response.text();
console.log("Uploaded image:", imagePath);
```

#### Upload a Video
```javascript
const formData = new FormData();
formData.append("video", videoFile);

const response = await fetch("https://your-server/upload/video", {
  method: "POST",
  headers: {
    Authorization: "Bearer your-api-key",
  },
  body: formData,
});

const videoPath = await response.text();
console.log("Uploaded video:", videoPath);
```

#### List Files
```javascript
const response = await fetch("https://your-server/media?type=image&sort=newest&limit=20", {
  headers: {
    Authorization: "Bearer your-api-key",
  },
});

const data = await response.json();
console.log("Files:", data.files);
```

### cURL Examples

#### Upload Image
```bash
curl -X POST \
  -H "Authorization: Bearer your-api-key" \
  -F "image=@photo.jpg" \
  https://your-server/upload/image/85
```

#### Download File
```bash
curl -X GET \
  -H "Authorization: Bearer your-api-key" \
  -o downloaded-file.jpg \
  https://your-server/download/image/filename.jpg
```

#### List Files
```bash
curl -X GET \
  -H "Authorization: Bearer your-api-key" \
  "https://your-server/media?type=image,video&sort=newest&limit=10"
```

## 🔒 Security Considerations

### Production Deployment
1. **Change default credentials** in `.env`
2. **Use strong API keys** and rotate regularly
3. **Enable HTTPS** for all external access
4. **Restrict file permissions** on upload directories
5. **Use environment-specific configurations**
6. **Implement rate limiting** for API endpoints
7. **Regular security updates** for dependencies

### File Security
- Files with "client" in the filename are excluded from listings
- Direct file access doesn't require authentication
- Download endpoints require API key authentication
- File paths are validated to prevent directory traversal

## 🐛 Troubleshooting

### Common Issues

#### FFmpeg Not Found
```bash
# Check FFmpeg installation
ffmpeg -version

# Run the FFmpeg check script
node install-ffmpeg.js
```

#### Permission Denied
```bash
# Fix upload directory permissions
sudo chown -R $USER:$USER uploads/
chmod -R 755 uploads/
```

#### Port Already in Use
```bash
# Change port in .env file
PORT=3001

# Or kill existing process
lsof -ti:3000 | xargs kill -9
```

#### Container Issues (Docker)
```bash
# Check container logs
docker compose logs -f

# Rebuild container
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development

# Check server logs
npm run dev
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Check the [troubleshooting section](#-troubleshooting)
- Review the [Docker README](./DOCKER_README.md)
- Review the [UI README](./UI_README.md)
- Open an issue on GitHub

---

**Note:** This server is designed for production use with proper security configurations. Always change default credentials and API keys before deployment.
