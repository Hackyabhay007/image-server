// Login Page JavaScript
class LoginManager {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        this.loginBtn = document.querySelector('.login-btn');
        
        // Configuration from server
        const config = window.SERVER_CONFIG || {};

        // Environment variables
        const API_BASE_URL = config.API_BASE_URL || 'https://storage.cmsil.org';
        const API_KEY = config.API_KEY || '5d92b8f69c9dda89f38c10fa6750376a25b53a9afd47e74951104769630d4ccc';
        const ADMIN_USERNAME = config.ADMIN_USERNAME || 'admin';
        const ADMIN_PASSWORD = config.ADMIN_PASSWORD || 'admin123';
        const CURRENT_ENV = config.CURRENT_ENV || 'PRODUCTION';
        const SESSION_TIMEOUT = config.SESSION_TIMEOUT || 86400000; // 24 hours
        const ENABLE_AUTH = config.ENABLE_AUTH !== false; // Default to true

        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Check if user is already logged in
        if (this.isLoggedIn()) {
            this.redirectToDashboard();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            this.showError('Please enter both username and password');
            return;
        }

        this.setLoading(true);
        
        try {
            const isValid = this.validateCredentials(username, password);
            
            if (isValid) {
                // Store login state
                this.setLoginState(username);
                
                // Show success animation
                document.querySelector('.login-card').classList.add('success');
                
                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    this.redirectToDashboard();
                }, 1000);
                
            } else {
                this.showError('Invalid username or password');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login failed. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    validateCredentials(username, password) {
        const config = window.SERVER_CONFIG || {};
        const adminUsername = config.ADMIN_USERNAME || 'admin';
        const adminPassword = config.ADMIN_PASSWORD || 'admin123';
        return username === adminUsername && password === adminPassword;
    }

    setLoginState(username) {
        const loginData = {
            username: username,
            timestamp: Date.now(),
            isLoggedIn: true
        };
        
        localStorage.setItem('dashboard_login', JSON.stringify(loginData));
    }

    isLoggedIn() {
        const loginData = localStorage.getItem('dashboard_login');
        if (!loginData) return false;
        
        try {
            const data = JSON.parse(loginData);
            const now = Date.now();
            const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
            
            // Check if session is still valid
            if (data.isLoggedIn && (now - data.timestamp) < sessionTimeout) {
                return true;
            } else {
                // Session expired, clear it
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Error parsing login data:', error);
            this.logout();
            return false;
        }
    }

    logout() {
        localStorage.removeItem('dashboard_login');
    }

    redirectToDashboard() {
        window.location.href = '/dashboard';
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.style.display = 'flex';
        
        // Auto-hide error after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }

    setLoading(loading) {
        if (loading) {
            this.loginBtn.disabled = true;
            this.loginBtn.classList.add('loading');
            this.loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        } else {
            this.loginBtn.disabled = false;
            this.loginBtn.classList.remove('loading');
            this.loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        }
    }
}

// Initialize login manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});

// Add some interactive features
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('input');
    
    inputs.forEach(input => {
        // Clear error when user starts typing
        input.addEventListener('input', () => {
            const errorMessage = document.getElementById('errorMessage');
            if (errorMessage.style.display === 'flex') {
                errorMessage.style.display = 'none';
            }
        });
        
        // Enter key to submit form
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('loginForm').dispatchEvent(new Event('submit'));
            }
        });
    });
}); 