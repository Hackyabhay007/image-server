# Environment Setup for Image Server

## Overview

The application uses environment variables from a `.env` file for all configuration. These variables are loaded by the server and injected directly into HTML pages, eliminating the need for separate API calls to fetch configuration.

## Environment Variables

### Current Configuration (.env)

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# API Configuration
API_KEYS=5d92b8f69c9dda89f38c10fa6750376a25b53a9afd47e74951104769630d4ccc
BASE_URL=https://storage.cmsil.org

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Environment Settings
CURRENT_ENV=PRODUCTION
```

### Environment Variables Explained

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `PORT` | Server port number | `3000` |
| `NODE_ENV` | Node.js environment | `development` |
| `API_KEYS` | API key for external service | `5d92b8f69c9dda89f38c10fa6750376a25b53a9afd47e74951104769630d4ccc` |
| `BASE_URL` | External API base URL | `https://storage.cmsil.org` |
| `ADMIN_USERNAME` | Admin login username | `admin` |
| `ADMIN_PASSWORD` | Admin login password | `admin123` |
| `CURRENT_ENV` | Current environment | `PRODUCTION` |
| `SESSION_TIMEOUT` | Session timeout in milliseconds | `86400000` (24 hours) |
| `ENABLE_AUTH` | Enable authentication | `true` |

## Setup Instructions

### 1. Environment Configuration

1. **Edit the .env file:**
   ```bash
   nano .env
   ```

2. **Update variables for your environment:**
   ```env
   # For development
   PORT=3000
   NODE_ENV=development
   BASE_URL=http://localhost:3000
   CURRENT_ENV=DEVELOPMENT
   
   # For production
   PORT=3000
   NODE_ENV=production
   BASE_URL=https://storage.cmsil.org
   CURRENT_ENV=PRODUCTION
   ```

### 2. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start

# Or directly
node index.js
```

### 3. Access Points

- **Root URL**: `http://localhost:3000/` → Redirects to login
- **Login Page**: `http://localhost:3000/login`
- **Dashboard**: `http://localhost:3000/dashboard`
- **Environment Test**: `http://localhost:3000/test-env`

## How It Works

### Server-Side Configuration

The server loads environment variables using `dotenv`:

```javascript
require("dotenv").config();

const API_KEYS = [process.env.API_KEYS || 'default-key'];
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || 'https://storage.cmsil.org';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
```

### HTML Injection Process

1. **Server loads HTML template** with placeholder: `<!-- CONFIG_PLACEHOLDER -->`
2. **Environment variables are injected** as a JavaScript object
3. **HTML is served** with configuration embedded
4. **Frontend JavaScript** accesses config via `window.SERVER_CONFIG`

Example of injected configuration:
```html
<script>const SERVER_CONFIG = {
  "API_BASE_URL": "https://storage.cmsil.org",
  "API_KEY": "your-api-key",
  "ADMIN_USERNAME": "admin",
  "ADMIN_PASSWORD": "admin123",
  "CURRENT_ENV": "PRODUCTION",
  "SESSION_TIMEOUT": 86400000,
  "ENABLE_AUTH": true,
  "NODE_ENV": "development"
};</script>
```

### Client-Side Configuration

The frontend receives configuration directly from the server through HTML injection:

```javascript
// Configuration is automatically available in HTML pages
const config = window.SERVER_CONFIG || {};

// Access environment variables
const API_BASE_URL = config.API_BASE_URL;
const API_KEY = config.API_KEY;
const ADMIN_USERNAME = config.ADMIN_USERNAME;
// ... etc
```

## Environment Scenarios

### Development Environment

```env
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000
CURRENT_ENV=DEVELOPMENT
ADMIN_USERNAME=dev-admin
ADMIN_PASSWORD=dev-password
```

### Production Environment

```env
PORT=3000
NODE_ENV=production
BASE_URL=https://storage.cmsil.org
CURRENT_ENV=PRODUCTION
ADMIN_USERNAME=prod-admin
ADMIN_PASSWORD=secure-password
```

### Testing Environment

```env
PORT=3001
NODE_ENV=test
BASE_URL=https://test-storage.cmsil.org
CURRENT_ENV=TEST
ADMIN_USERNAME=test-admin
ADMIN_PASSWORD=test-password
```

## Security Features

### Environment Variable Security

- ✅ Sensitive data stored in `.env` file
- ✅ `.env` file should be in `.gitignore`
- ✅ Fallback values for missing variables
- ✅ Server-side validation of environment variables

### Authentication Security

- ✅ Environment-based admin credentials
- ✅ Session timeout configuration
- ✅ Secure logout functionality
- ✅ Authentication state validation

## Testing Environment Configuration

### 1. Access Test Page

Visit `http://localhost:3000/test-env` to test:

- Server configuration loading
- Environment variable display
- Authentication credentials
- API connection

### 2. Manual Testing

```bash
# Test server startup
node index.js

# Check environment variables
echo $PORT
echo $NODE_ENV
echo $API_KEYS
```

### 3. API Testing

```bash
# Test authentication
curl -H "Authorization: Bearer YOUR_API_KEY" \
     http://localhost:3000/media?limit=1
```

## Troubleshooting

### Common Issues

1. **"Cannot find module 'dotenv'"**
   ```bash
   npm install dotenv
   ```

2. **Environment variables not loading**
   - Check `.env` file exists in project root
   - Verify variable names match exactly
   - Restart server after changes

3. **Frontend not getting server config**
   - Check that HTML pages contain the config placeholder
   - Verify server is injecting configuration correctly
   - Check browser console for errors

4. **Authentication not working**
   - Verify `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env`
   - Check `ENABLE_AUTH` setting
   - Clear browser localStorage if needed

### Debug Mode

Enable debug logging:

```javascript
// In browser console
localStorage.setItem('dashboard_debug', 'true');

// In server
NODE_ENV=development
```

## File Structure

```
image-server/
├── .env                          # Environment variables
├── index.js                      # Server with env config
├── ui/                           # UI files
│   ├── login.html                # Login page
│   ├── dashboard.html            # Dashboard
│   └── test-env.html             # Environment test page
└── ENV_SETUP_README.md          # This file
```

## Best Practices

### Environment Management

1. **Never commit `.env` files** to version control
2. **Use different credentials** for each environment
3. **Validate environment variables** on server startup
4. **Provide fallback values** for missing variables

### Security

1. **Use strong passwords** for admin accounts
2. **Rotate API keys** regularly
3. **Limit environment variable access**
4. **Monitor authentication logs**

### Development

1. **Use environment-specific configurations**
2. **Test all environments** before deployment
3. **Document environment requirements**
4. **Use consistent naming conventions**

## Next Steps

1. **Customize your `.env` file** for your environment
2. **Test the configuration** using `/test-env`
3. **Deploy with proper environment variables**
4. **Monitor and maintain** the configuration 