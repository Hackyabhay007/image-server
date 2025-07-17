// Configuration file for the dashboard
const config = {
    // API Key - Get from server-injected config
    get API_KEY() {
        return window.SERVER_CONFIG ? window.SERVER_CONFIG.API_KEY : '5d92b8f69c9dda89f38c10fa6750376a25b53a9afd47e74951104769630d4ccc';
    },
    
    // Server settings - Get from server-injected config
    get SERVER_URL() {
        return window.SERVER_CONFIG ? window.SERVER_CONFIG.API_BASE_URL : "https://storage.cmsil.org";
    },
    
    // Admin credentials - Get from server-injected config
    get ADMIN_USERNAME() {
        return window.SERVER_CONFIG ? window.SERVER_CONFIG.ADMIN_USERNAME : 'admin';
    },
    
    get ADMIN_PASSWORD() {
        return window.SERVER_CONFIG ? window.SERVER_CONFIG.ADMIN_PASSWORD : 'admin123';
    },
    
    get CURRENT_ENV() {
        return window.SERVER_CONFIG ? window.SERVER_CONFIG.CURRENT_ENV : 'PRODUCTION';
    },
    
    get SESSION_TIMEOUT() {
        return window.SERVER_CONFIG ? window.SERVER_CONFIG.SESSION_TIMEOUT : 86400000;
    },
    
    get ENABLE_AUTH() {
        return window.SERVER_CONFIG ? window.SERVER_CONFIG.ENABLE_AUTH : true;
    },
    
    // Dashboard settings
    DEFAULT_PAGE_SIZE: 10,
    MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
    
    // File type configurations
    SUPPORTED_TYPES: {
        image: {
            extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'],
            maxSize: 10 * 1024 * 1024, // 10MB
            icon: 'fas fa-image'
        },
        video: {
            extensions: ['.mp4', '.avi', '.mov', '.webm', '.mkv', '.wmv', '.flv'],
            maxSize: 100 * 1024 * 1024, // 100MB
            icon: 'fas fa-video'
        },
        audio: {
            extensions: ['.mp3', '.wav', '.aac', '.ogg', '.flac', '.m4a'],
            maxSize: 50 * 1024 * 1024, // 50MB
            icon: 'fas fa-music'
        },
        pdf: {
            extensions: ['.pdf'],
            maxSize: 20 * 1024 * 1024, // 20MB
            icon: 'fas fa-file-pdf'
        },
        doc: {
            extensions: ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf'],
            maxSize: 15 * 1024 * 1024, // 15MB
            icon: 'fas fa-file-alt'
        }
    },
    
    // UI settings
    TOAST_DURATION: 5000, // 5 seconds
    SEARCH_DELAY: 300, // 300ms
    ANIMATION_DURATION: 300, // 300ms
    
    // Colors for different file types
    COLORS: {
        image: '#667eea',
        video: '#764ba2',
        audio: '#f093fb',
        pdf: '#ff6b6b',
        doc: '#2ed573'
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
} else {
    window.config = config;
} 