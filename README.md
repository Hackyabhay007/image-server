# Image and Video Server API Documentation

A Node.js server for image and video processing, compression, and storage with API authentication.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Authentication](#authentication)
- [Image Routes](#image-routes)
- [Video Routes](#video-routes)
- [Media Routes](#media-routes)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Installation

### Prerequisites

- Node.js (v14+)
- FFmpeg installed on your system

### Steps

1. Clone the repository:

```bash
git clone <repository-url>
cd /D:/fyt/image-server
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with your configuration:

```
PORT=3000
API_KEYS=your-secret-api-key-here
BASE_URL=http://localhost:3000
```

4. Create the upload directories:

```bash
mkdir -p uploads/images uploads/videos
```

5. Start the server:

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

### FFmpeg Installation

This server requires FFmpeg for video compression:

- **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH
- **macOS**: `brew install ffmpeg`
- **Linux**: `apt install ffmpeg` or equivalent

To verify your FFmpeg installation, run:

```bash
node ffmpeg-check.js
```

This server requires FFmpeg for video compression. If you encounter errors related to missing FFmpeg, you can:

1. Run the installation helper script:
   ```bash
   node install-ffmpeg.js
   ```

```

## Configuration

- **PORT**: Server port (default: 3000)
- **API_KEYS**: Comma-separated list of valid API keys
- **BASE_URL**: Base URL for constructing file URLs

## Authentication

Most routes require authentication via an API key. Include the API key in the `Authorization` header:

```

Authorization: Bearer YOUR_API_KEY_HERE

```

API keys are configured in the `.env` file.

Public routes that don't require authentication:

- `/image/:filename` - Get an image
- `/video/:filename` - Get a video

## Image Routes

### Get an image

```

GET /image/:filename

```

Parameters:

- `:filename` - The filename of the image

Query parameters:

- `quality` (optional) - JPEG quality (1-100). Example: `/image/my-image.jpg?quality=75`

Example:

```

GET /image/vacation-photo-1615487236547.jpg

```

### Get all images (with pagination)

```

GET /images

```

Query parameters:

- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Results per page (default: 10)
- `sort` (optional) - Sorting method:
  - `newest` (default) - Sort by creation date, newest first
  - `oldest` - Sort by creation date, oldest first
  - `name` - Sort alphabetically by filename
  - `size` - Sort by file size, largest first

Example:

```

GET /images?page=2&limit=20&sort=newest

````

Response:

```json
{
  "total": 45,
  "pages": 3,
  "currentPage": 2,
  "results": [
    {
      "filename": "beach-photo-1615487236547.jpg",
      "url": "http://localhost:3000/image/beach-photo-1615487236547.jpg",
      "created": "2023-06-15T12:30:45.000Z",
      "size": 1024567,
      "type": "image"
    },
    ...
  ],
  "next": {
    "page": 3,
    "limit": 20
  },
  "previous": {
    "page": 1,
    "limit": 20
  }
}
````

### Upload an image

```
POST /upload/:quality?
```

Parameters:

- `:quality` (optional) - JPEG quality (1-100, default: 90)

Form data:

- `image` - The image file to upload

Example:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "image=@/path/to/image.jpg" \
  http://localhost:3000/upload/95
```

Response:

```
image/beach-photo-1615487236547.jpg
```

## Video Routes

### Get a video

```
GET /video/:filename
```

Parameters:

- `:filename` - The filename of the video

Example:

```
GET /video/compressed-vacation-video-1615487236547.mp4
```

### Get all videos (with pagination)

```
GET /videos
```

Query parameters:

- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Results per page (default: 10)
- `sort` (optional) - Sorting method:
  - `newest` (default) - Sort by creation date, newest first
  - `oldest` - Sort by creation date, oldest first
  - `name` - Sort alphabetically by filename
  - `size` - Sort by file size, largest first

Example:

```
GET /videos?page=1&limit=5&sort=size
```

Response:

```json
{
  "total": 12,
  "pages": 3,
  "currentPage": 1,
  "results": [
    {
      "filename": "compressed-vacation-video-1615487236547.mp4",
      "url": "http://localhost:3000/video/compressed-vacation-video-1615487236547.mp4",
      "created": "2023-06-15T12:30:45.000Z",
      "size": 5024567,
      "type": "video"
    },
    ...
  ],
  "next": {
    "page": 2,
    "limit": 5
  }
}
```

### Upload a video

```
POST /upload-video
```

Form data:

- `video` - The video file to upload

Example:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "video=@/path/to/video.mp4" \
  http://localhost:3000/upload-video
```

Response:

```
video/compressed-vacation-video-1615487236547.mp4
```

## Media Routes

### Get all media (images and videos)

```
GET /media
```

Query parameters:

- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Results per page (default: 10)
- `sort` (optional) - Sorting method:
  - `newest` (default) - Sort by creation date, newest first
  - `oldest` - Sort by creation date, oldest first
  - `name` - Sort alphabetically by filename
  - `size` - Sort by file size, largest first
  - `type` - Sort by media type (image/video)
- `type` (optional) - Filter by media type:
  - `all` (default) - Include both images and videos
  - `image` - Only include images
  - `video` - Only include videos

Example:

```
GET /media?page=1&limit=10&sort=type&type=all
```

Response:

```json
{
  "total": 57,
  "pages": 6,
  "currentPage": 1,
  "results": [
    {
      "filename": "beach-photo-1615487236547.jpg",
      "url": "http://localhost:3000/image/beach-photo-1615487236547.jpg",
      "created": "2023-06-15T12:30:45.000Z",
      "size": 1024567,
      "type": "image"
    },
    {
      "filename": "compressed-vacation-video-1615487236547.mp4",
      "url": "http://localhost:3000/video/compressed-vacation-video-1615487236547.mp4",
      "created": "2023-06-15T12:30:45.000Z",
      "size": 5024567,
      "type": "video"
    },
    ...
  ],
  "next": {
    "page": 2,
    "limit": 10
  }
}
```

### Delete a media file (image or video)

## Examples

### JavaScript Fetch Example (Upload Image)

```javascript
const uploadImage = async (imageFile, apiKey, quality = 90) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await fetch(`http://localhost:3000/upload/${quality}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }

  const imageUrl = await response.text();
  return `http://localhost:3000/${imageUrl}`;
};

// Example usage:
document.getElementById("imageForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const imageFile = document.getElementById("imageInput").files[0];
  const apiKey = "YOUR_API_KEY";

  try {
    const imageUrl = await uploadImage(imageFile, apiKey);
    console.log("Uploaded image URL:", imageUrl);
    document.getElementById("resultImage").src = imageUrl;
  } catch (error) {
    console.error("Upload failed:", error);
  }
});
```

### Node.js Axios Example (Get All Media)

```javascript
const axios = require("axios");

const getAllMedia = async (
  apiKey,
  page = 1,
  limit = 20,
  sort = "newest",
  type = "all"
) => {
  try {
    const response = await axios.get("http://localhost:3000/media", {
      params: { page, limit, sort, type },
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching media:", error);
    throw error;
  }
};

// Example usage:
const apiKey = "YOUR_API_KEY";
getAllMedia(apiKey, 1, 10, "size")
  .then((mediaData) => {
    console.log(`Found ${mediaData.total} media items`);
    mediaData.results.forEach((item) => {
      console.log(
        `${item.type}: ${item.filename} (${Math.round(item.size / 1024)}KB)`
      );
    });
  })
  .catch((err) => console.error("Failed to get media:", err));
```

### React Example (Display Images)

```jsx
import { useState, useEffect } from "react";
import axios from "axios";

const ImageGallery = ({ apiKey }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:3000/images", {
          params: { page, limit: 12, sort: "newest" },
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });
        setImages(response.data.results);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [page, apiKey]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Image Gallery</h2>
      <div className="gallery-grid">
        {images.map((image) => (
          <div key={image.filename} className="gallery-item">
            <img src={image.url} alt={image.filename} loading="lazy" />
            <p>{image.filename}</p>
          </div>
        ))}
      </div>
      <div className="pagination">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button onClick={() => setPage((p) => p + 1)} disabled={!images.length}>
          Next
        </button>
      </div>
    </div>
  );
};

export default ImageGallery;
```

### cURL Examples

#### Upload Image:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "image=@/path/to/image.jpg" \
  http://localhost:3000/upload/90
```

#### Upload Video:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "video=@/path/to/video.mp4" \
  http://localhost:3000/upload-video
```

#### Get Images with Pagination:

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_API_KEY" \
  "http://localhost:3000/images?page=1&limit=5&sort=newest"
```

#### Get an Image with Custom Quality:

```bash
curl -X GET "http://localhost:3000/image/beach-photo-1615487236547.jpg?quality=75"
```

## Troubleshooting

### Video Compression Issues

If you encounter problems with video compression:

1. Run the FFmpeg diagnostic script:

   ```bash
   node ffmpeg-check.js
   ```

2. Make sure FFmpeg is installed correctly and available in your PATH

3. Check the server logs for detailed FFmpeg error messages

4. For larger videos, increase the server timeout or consider implementing a queue system

### Common Error Codes

- **404**: File not found - Check that the file exists in the correct directory
- **401**: Unauthorized - API key is missing or invalid
- **400**: Bad request - Missing required parameters or invalid input
- **500**: Server error - Check server logs for details

### Path Resolution Issues

If files aren't being found or saved correctly:

1. Ensure the upload directories exist and have proper permissions
2. Use absolute paths with `path.resolve()` for reliable file operations
3. Check that disk space is available
4. Verify URL encoding/decoding is working properly
