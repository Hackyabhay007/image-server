# Docker Deployment Guide

## 🐳 Overview

This guide explains how to deploy the Image Server using Docker and Docker Compose.

## 📋 Prerequisites

- Docker installed on your system
- Docker Compose (usually included with Docker Desktop)
- At least 2GB of available disk space

## 🚀 Quick Start

### 1. Build the Docker Image

```bash
# Navigate to the image-server directory
cd image-server

# Build the image
docker compose build
```

### 2. Run the Container

```bash
# Start the container in detached mode
docker compose up -d

# Or start with logs visible
docker compose up
```

### 3. Access the Application

- **Dashboard**: http://localhost:3001/dashboard
- **Login**: http://localhost:3001/login
- **API**: http://localhost:3001/api/*

### 4. Default Credentials

- **Username**: `admin`
- **Password**: `admin123`
- **API Key**: `5d92b8f69c9dda89f38c10fa6750376a25b53a9afd47e74951104769630d4ccc`

## 🔧 Configuration

### Environment Variables

The application uses a `.env` file for configuration. Key variables:

```env
# Server Configuration
PORT=3000                    # Internal port (don't change)
NODE_ENV=production          # Environment mode

# API Configuration
API_KEYS=your-api-key        # API key for authentication
BASE_URL=http://localhost:3001  # External URL for the service

# Admin Authentication
ADMIN_USERNAME=admin         # Admin login username
ADMIN_PASSWORD=admin123      # Admin login password

# Environment Settings
CURRENT_ENV=PRODUCTION       # Environment identifier
SESSION_TIMEOUT=86400000     # Session timeout (24 hours)
ENABLE_AUTH=true             # Enable authentication
```

### Customizing Configuration

1. **Edit the `.env` file**:
   ```bash
   nano .env
   ```

2. **For production**, update these values:
   ```env
   BASE_URL=https://your-domain.com
   API_KEYS=your-secure-api-key
   ADMIN_USERNAME=your-admin-username
   ADMIN_PASSWORD=your-secure-password
   ```

3. **Restart the container**:
   ```bash
   docker compose down
   docker compose up -d
   ```

## 📁 File Storage

### Volume Mounts

The container mounts the local `./uploads` directory to `/app/uploads` inside the container:

```
./uploads/           # Local directory
├── images/          # Image files
├── video/           # Video files
├── audio/           # Audio files
├── pdf/             # PDF files
└── docs/            # Document files
```

### Persistence

- **Files are persisted** between container restarts
- **Uploads directory** is created automatically
- **File permissions** are maintained

## 🛠️ Management Commands

### View Container Status

```bash
# Check if container is running
docker compose ps

# View container logs
docker compose logs -f

# View recent logs
docker compose logs --tail=100
```

### Stop and Start

```bash
# Stop the container
docker compose down

# Start the container
docker compose up -d

# Restart the container
docker compose restart
```

### Update the Application

```bash
# Pull latest changes (if using git)
git pull

# Rebuild the image
docker compose build --no-cache

# Restart with new image
docker compose down
docker compose up -d
```

### Clean Up

```bash
# Stop and remove containers
docker compose down

# Remove images
docker compose down --rmi all

# Remove volumes (WARNING: This deletes all uploaded files)
docker compose down -v
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error**: `Port 3001 is already in use`

**Solution**: Change the port in `docker-compose.yml`:
```yaml
ports:
  - "3002:3000"  # Use port 3002 instead
```

#### 2. Permission Denied

**Error**: `Permission denied` when accessing uploads

**Solution**: Fix directory permissions:
```bash
sudo chown -R $USER:$USER uploads/
chmod -R 755 uploads/
```

#### 3. Container Won't Start

**Error**: Container exits immediately

**Solution**: Check logs for errors:
```bash
docker compose logs
```

#### 4. FFmpeg Not Working

**Error**: Video compression fails

**Solution**: Verify FFmpeg installation in container:
```bash
docker compose exec image-server ffmpeg -version
```

### Debug Mode

Enable debug logging:

```bash
# Add to .env file
NODE_ENV=development

# Restart container
docker compose restart
```

## 🔒 Security Considerations

### Production Deployment

1. **Change default credentials**:
   ```env
   ADMIN_USERNAME=your-secure-username
   ADMIN_PASSWORD=your-secure-password
   API_KEYS=your-secure-api-key
   ```

2. **Use HTTPS**:
   ```env
   BASE_URL=https://your-domain.com
   ```

3. **Restrict file access**:
   ```bash
   chmod 600 .env
   ```

4. **Use secrets management**:
   ```yaml
   # In docker-compose.yml
   secrets:
     - api_key
     - admin_password
   ```

### Network Security

- **Firewall**: Only expose necessary ports
- **Reverse Proxy**: Use nginx/apache for SSL termination
- **Rate Limiting**: Implement API rate limiting

## 📊 Monitoring

### Health Checks

Monitor container health:

```bash
# Check container status
docker compose ps

# Monitor resource usage
docker stats
```

### Logs

```bash
# Follow logs in real-time
docker compose logs -f

# Search logs
docker compose logs | grep "ERROR"
```

## 🚀 Production Deployment

### Using Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml image-server
```

### Using Kubernetes

Create a deployment manifest:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: image-server
spec:
  replicas: 2
  selector:
    matchLabels:
      app: image-server
  template:
    metadata:
      labels:
        app: image-server
    spec:
      containers:
      - name: image-server
        image: image-server:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
```

## 📞 Support

For issues and questions:

1. Check the logs: `docker compose logs`
2. Verify configuration: `./test-docker.sh`
3. Check file permissions
4. Ensure Docker has sufficient resources

## 📝 Notes

- **FFmpeg**: Pre-installed in the container for video processing
- **Node.js**: Version 18 (LTS) with slim image for smaller size
- **Ports**: 3000 (internal), 3001 (external)
- **Volumes**: Uploads directory is persisted
- **Restart**: Container auto-restarts unless manually stopped 