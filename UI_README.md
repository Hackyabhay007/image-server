# File Management Dashboard - UI Structure

## Overview

The dashboard has been reorganized with a proper UI folder structure and authentication system.

## Folder Structure

```
image-server/
├── ui/                          # UI files folder
│   ├── login.html              # Login page
│   ├── login.css               # Login page styles
│   ├── login.js                # Login functionality
│   ├── dashboard.html          # Main dashboard
│   ├── dashboard.css           # Dashboard styles
│   ├── dashboard.js            # Dashboard functionality
│   ├── env.js                  # Environment configuration
│   └── config.js               # Dashboard configuration
├── index.js                    # Server backend
└── UI_README.md               # This file
```

## Authentication System

### Default Credentials
- **Username**: `admin`
- **Password**: `admin123`

### Features
- Session-based authentication (24-hour sessions)
- Automatic logout on session expiry
- Secure credential validation
- Login state persistence

## Access Points

### 1. Login Page
```
http://localhost:3000/login
```
- Admin authentication required
- Redirects to dashboard on successful login

### 2. Dashboard
```
http://localhost:3000/dashboard
```
- Requires authentication
- Redirects to login if not authenticated

### 3. Root URL
```
http://localhost:3000/
```
- Automatically redirects to login page

## Environment Configuration

### Production Environment
- **API Base URL**: `https://storage.cmsil.org`
- **API Key**: `5d92b8f69c9dda89f38c10fa6750376a25b53a9afd47e74951104769630d4ccc`
- **Admin Username**: `admin`
- **Admin Password**: `admin123`

### Development Environment
- **API Base URL**: `http://localhost:3000`
- **API Key**: `5d92b8f69c9dda89f38c10fa6750376a25b53a9afd47e74951104769630d4ccc`
- **Admin Username**: `admin`
- **Admin Password**: `admin123`

## How to Use

### 1. Start the Server
```bash
node index.js
```

### 2. Access the Application
1. Open your browser and go to `http://localhost:3000`
2. You'll be redirected to the login page
3. Enter the admin credentials:
   - Username: `admin`
   - Password: `admin123`
4. Click "Login" to access the dashboard

### 3. Using the Dashboard
- **File Management**: View, upload, download, delete files
- **Search & Filter**: Find files by name or type
- **Sort Options**: Sort by newest, oldest, name, or size
- **Logout**: Click the logout button in the header

## Security Features

### Authentication
- Credential validation against environment config
- Session management with localStorage
- Automatic session expiry (24 hours)
- Secure logout functionality

### Access Control
- All dashboard routes require authentication
- Automatic redirect to login for unauthenticated users
- Session validation on every page load

## Customization

### Changing Credentials
Edit `ui/env.js` to update admin credentials:
```javascript
window.ENV = {
    PRODUCTION: {
        ADMIN_USERNAME: 'your-username',
        ADMIN_PASSWORD: 'your-password'
    }
    // ... other environments
};
```

### Switching Environments
Change the current environment in `ui/env.js`:
```javascript
window.CURRENT_ENV = 'DEVELOPMENT'; // or 'PRODUCTION' or 'TEST'
```

## Troubleshooting

### Common Issues

1. **"Access Denied" or redirect loop**
   - Clear browser localStorage: `localStorage.clear()`
   - Check credentials in `env.js`

2. **Dashboard not loading**
   - Verify server is running on correct port
   - Check browser console for errors
   - Ensure all UI files are in the `ui/` folder

3. **API connection errors**
   - Verify API key and base URL in `env.js`
   - Check network connectivity
   - Ensure external API is accessible

### Debug Mode
Enable debug logging in browser console:
```javascript
localStorage.setItem('dashboard_debug', 'true');
```

## File Management Features

### Supported File Types
- **Images**: JPG, PNG, GIF, WebP, BMP
- **Videos**: MP4, AVI, MOV, WebM, MKV
- **Audio**: MP3, WAV, AAC, OGG, FLAC
- **Documents**: PDF, DOC, DOCX, XLS, XLSX
- **Others**: TXT, RTF, and more

### File Operations
- **Upload**: Drag & drop, multiple files
- **Download**: Direct file download
- **Delete**: Secure file deletion
- **Preview**: In-browser preview
- **Share**: URL sharing functionality

## API Integration

The dashboard connects to your external API at `https://storage.cmsil.org` with the provided API key. All file operations are performed through the API endpoints.

## Next Steps

1. Update admin credentials in `ui/env.js`
2. Test the login system
3. Upload and manage files through the dashboard
4. Customize the UI as needed 