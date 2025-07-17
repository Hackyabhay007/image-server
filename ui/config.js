// Configuration file for the dashboard
const config = {
    // API Key - Get from environment config
    get API_KEY() {
        return window.getCurrentEnv ? window.getCurrentEnv().API_KEY : '5d92b8f69c9dda89f38c10fa6750376a25b53a9afd47e74951104769630d4ccc';
    },
    
    // Server settings - Get from environment config
    get SERVER_URL() {
        return window.getCurrentEnv ? window.getCurrentEnv().API_BASE_URL : "https://storage.cmsil.org";
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