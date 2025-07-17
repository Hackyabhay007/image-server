#!/bin/bash

echo "🐳 Docker Configuration Test Script"
echo "=================================="

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✅ .env file found"
    echo "   Environment variables:"
    grep -v '^#' .env | grep -v '^$' | while read line; do
        echo "   - $line"
    done
else
    echo "❌ .env file not found"
    exit 1
fi

# Check if Dockerfile exists
if [ -f "Dockerfile" ]; then
    echo "✅ Dockerfile found"
else
    echo "❌ Dockerfile not found"
    exit 1
fi

# Check if docker-compose.yml exists
if [ -f "docker-compose.yml" ]; then
    echo "✅ docker-compose.yml found"
else
    echo "❌ docker-compose.yml not found"
    exit 1
fi

# Check if package.json exists
if [ -f "package.json" ]; then
    echo "✅ package.json found"
else
    echo "❌ package.json not found"
    exit 1
fi

echo ""
echo "📋 Docker Configuration Summary:"
echo "================================"
echo "• Base Image: node:18-slim"
echo "• FFmpeg: Installed via apt-get"
echo "• Working Directory: /app"
echo "• Exposed Port: 3000 (internal)"
echo "• Mapped Port: 3001 (external)"
echo "• Volume Mount: ./uploads → /app/uploads"
echo "• Environment: Loaded from .env file"
echo "• Restart Policy: unless-stopped"

echo ""
echo "🚀 To build and run the container:"
echo "=================================="
echo "1. Build the image:"
echo "   docker compose build"
echo ""
echo "2. Run the container:"
echo "   docker compose up -d"
echo ""
echo "3. View logs:"
echo "   docker compose logs -f"
echo ""
echo "4. Stop the container:"
echo "   docker compose down"
echo ""
echo "🌐 Access the application:"
echo "========================="
echo "• Dashboard: http://localhost:3001/dashboard"
echo "• Login: http://localhost:3001/login"
echo "• API: http://localhost:3001/api/*"
echo ""
echo "🔧 Default credentials:"
echo "======================"
echo "• Username: admin"
echo "• Password: admin123"
echo "• API Key: 5d92b8f69c9dda89f38c10fa6750376a25b53a9afd47e74951104769630d4ccc" 