# Image & Media Server API

A Node.js Express server for uploading, compressing, serving, listing, and downloading images, videos, audio, PDFs, and document files. Supports API key authentication and flexible media management.

---

## Features

- **Image upload** with JPEG compression (via [@imazen/imageflow](https://www.npmjs.com/package/@imazen/imageflow))
- **Video upload** with optional compression (via [fluent-ffmpeg](https://www.npmjs.com/package/fluent-ffmpeg))
- **Audio, PDF, and document file support**
- **Flexible file serving**: `/image/:filename`, `/video/:filename`, etc.
- **Media listing** with pagination, sorting, and filtering by type
- **Download endpoint** for any media type
- **API key authentication** for protected routes
- **Robust file lookup** (searches multiple directories for each type)
- **Automatic directory creation**
- **Excludes images with "client" in the filename from listings**

---

## Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd image-server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create a `.env` file**

   ```
   PORT=3000
   API_KEYS=your-api-key
   BASE_URL=https://your-domain-or-ip:3000
   ```

   - `API_KEYS` can be a comma-separated list for multiple keys.

4. **Install FFmpeg**

   - **Linux:** `sudo apt install ffmpeg`
   - **macOS:** `brew install ffmpeg`
   - **Windows:** Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH.

   You can run `node install-ffmpeg.js` for guidance.

5. **Start the server**

   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

---

## API Usage

### Authentication

All routes except `/image/:filename` and `/video/:filename` require an API key:
