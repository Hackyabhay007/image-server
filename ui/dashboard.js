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

// Dashboard JavaScript
class Dashboard {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.currentType = 'all';
        this.currentSort = 'newest';
        this.searchQuery = '';
        this.files = [];
        this.filteredFiles = [];
        this.currentFile = null;
        
        this.init();
    }

    init() {
        // Check authentication first
        if (!this.checkAuth()) {
            return;
        }
        
        this.bindEvents();
        this.loadFiles();
        this.updateFileCounts();
        this.updateUserInfo();
    }

    bindEvents() {
        // Navigation events
        document.querySelectorAll('.nav-item[data-type]').forEach(item => {
            item.addEventListener('click', (e) => {
                this.setActiveNavItem(e.target.closest('.nav-item'));
                this.currentType = e.target.closest('.nav-item').dataset.type;
                this.currentPage = 1;
                this.loadFiles();
            });
        });

        document.querySelectorAll('.nav-item[data-sort]').forEach(item => {
            item.addEventListener('click', (e) => {
                this.setActiveSortItem(e.target.closest('.nav-item'));
                this.currentSort = e.target.closest('.nav-item').dataset.sort;
                this.currentPage = 1;
                this.loadFiles();
            });
        });

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const delay = 300; // Default search delay
            searchTimeout = setTimeout(() => {
                this.searchQuery = e.target.value;
                this.currentPage = 1;
                this.loadFiles();
            }, delay);
        });

        // Page size selector
        document.getElementById('pageSizeSelect').addEventListener('change', (e) => {
            this.pageSize = parseInt(e.target.value);
            this.currentPage = 1;
            this.loadFiles();
        });

        // Upload modal events
        this.setupUploadModal();
        
        // Preview modal events
        this.setupPreviewModal();
    }

    setActiveNavItem(activeItem) {
        document.querySelectorAll('.nav-item[data-type]').forEach(item => {
            item.classList.remove('active');
        });
        activeItem.classList.add('active');
    }

    setActiveSortItem(activeItem) {
        document.querySelectorAll('.nav-item[data-sort]').forEach(item => {
            item.classList.remove('active');
        });
        activeItem.classList.add('active');
    }

    async loadFiles() {
        this.showLoading();
        
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.pageSize,
                sort: this.currentSort
            });

            if (this.currentType !== 'all') {
                params.append('type', this.currentType);
            }

            const baseUrl = this.getBaseUrl();
            const response = await fetch(`${baseUrl}/media?${params}`, {
                headers: {
                    'Authorization': `Bearer ${this.getApiKey()}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.files = data.results || [];
            this.totalFiles = data.total || 0;
            this.totalPages = data.pages || 0;

            this.filterFiles();
            this.renderFiles();
            this.renderPagination();
            this.updateFileCounts();
            
        } catch (error) {
            console.error('Error loading files:', error);
            this.showToast('Error loading files', 'error');
            this.showEmptyState();
        } finally {
            this.hideLoading();
        }
    }

    filterFiles() {
        if (!this.searchQuery) {
            this.filteredFiles = this.files;
            return;
        }

        const query = this.searchQuery.toLowerCase();
        this.filteredFiles = this.files.filter(file => 
            file.filename.toLowerCase().includes(query) ||
            file.type.toLowerCase().includes(query)
        );
    }

    renderFiles() {
        const fileGrid = document.getElementById('fileGrid');
        
        if (this.filteredFiles.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();
        
        fileGrid.innerHTML = this.filteredFiles.map(file => this.createFileCard(file)).join('');
        
        // Add click events to file cards
        fileGrid.querySelectorAll('.file-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.openFilePreview(this.filteredFiles[index]);
            });
        });
    }

    createFileCard(file) {
        const fileSize = this.formatFileSize(file.size);
        const fileDate = new Date(file.created).toLocaleDateString();
        const fileIcon = this.getFileIcon(file.type);
        const previewContent = this.getFilePreview(file);

        return `
            <div class="file-card" data-filename="${file.filename}" data-type="${file.type}">
                <div class="file-preview ${file.type}">
                    ${previewContent}
                </div>
                <div class="file-info">
                    <div class="file-name" title="${file.filename}">${file.filename}</div>
                    <div class="file-meta">
                        <span class="file-date">${fileDate}</span>
                        <span class="file-size">${fileSize}</span>
                    </div>
                    <div class="file-actions">
                        <button class="action-btn" onclick="event.stopPropagation(); dashboard.downloadFile('${file.filename}', '${file.type}')" title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="action-btn" onclick="event.stopPropagation(); dashboard.shareFile('${file.url}')" title="Share">
                            <i class="fas fa-share"></i>
                        </button>
                        <button class="action-btn" onclick="event.stopPropagation(); dashboard.deleteFile('${file.filename}', '${file.type}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getFileIcon(type) {
        const icons = {
            image: 'fas fa-image',
            video: 'fas fa-video',
            audio: 'fas fa-music',
            pdf: 'fas fa-file-pdf',
            doc: 'fas fa-file-alt'
        };
        return icons[type] || 'fas fa-file';
    }

    getFilePreview(file) {
        if (file.type === 'image') {
            return `<img src="${file.url}" alt="${file.filename}" loading="lazy">`;
        } else if (file.type === 'video') {
            return `<video src="${file.url}" preload="metadata"></video>`;
        } else {
            return `<i class="${this.getFileIcon(file.type)}"></i>`;
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    renderPagination() {
        const paginationInfo = document.getElementById('paginationInfo');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const pageNumbers = document.getElementById('pageNumbers');

        const start = (this.currentPage - 1) * this.pageSize + 1;
        const end = Math.min(this.currentPage * this.pageSize, this.totalFiles);
        
        paginationInfo.textContent = `Showing ${start} to ${end} of ${this.totalFiles} files`;

        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === this.totalPages;

        // Generate page numbers
        let pageNumbersHtml = '';
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbersHtml += `
                <button class="page-number ${i === this.currentPage ? 'active' : ''}" 
                        onclick="dashboard.goToPage(${i})">${i}</button>
            `;
        }

        pageNumbers.innerHTML = pageNumbersHtml;

        // Add event listeners
        prevBtn.onclick = () => this.goToPage(this.currentPage - 1);
        nextBtn.onclick = () => this.goToPage(this.currentPage + 1);
    }

    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadFiles();
        }
    }

    async updateFileCounts() {
        try {
            const baseUrl = this.getBaseUrl();
            const response = await fetch(`${baseUrl}/media?limit=1000`, {
                headers: {
                    'Authorization': `Bearer ${this.getApiKey()}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const files = data.results || [];
                
                const counts = {
                    all: files.length,
                    image: files.filter(f => f.type === 'image').length,
                    video: files.filter(f => f.type === 'video').length,
                    audio: files.filter(f => f.type === 'audio').length,
                    pdf: files.filter(f => f.type === 'pdf').length,
                    doc: files.filter(f => f.type === 'doc').length
                };

                Object.keys(counts).forEach(type => {
                    const element = document.getElementById(`count-${type}`);
                    if (element) {
                        element.textContent = counts[type];
                    }
                });
            }
        } catch (error) {
            console.error('Error updating file counts:', error);
        }
    }

    setupUploadModal() {
        const uploadModal = document.getElementById('uploadModal');
        const singleUploadArea = document.getElementById('singleUploadArea');
        const multipleUploadArea = document.getElementById('multipleUploadArea');
        const singleFileInput = document.getElementById('singleFileInput');
        const multipleFileInput = document.getElementById('multipleFileInput');
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        // Tab switching
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(`${tab}Tab`).classList.add('active');
            });
        });

        // Drag and drop functionality
        [singleUploadArea, multipleUploadArea].forEach(area => {
            area.addEventListener('click', () => {
                const input = area === singleUploadArea ? singleFileInput : multipleFileInput;
                input.click();
            });

            area.addEventListener('dragover', (e) => {
                e.preventDefault();
                area.classList.add('dragover');
            });

            area.addEventListener('dragleave', () => {
                area.classList.remove('dragover');
            });

            area.addEventListener('drop', (e) => {
                e.preventDefault();
                area.classList.remove('dragover');
                
                const input = area === singleUploadArea ? singleFileInput : multipleFileInput;
                input.files = e.dataTransfer.files;
                
                if (area === singleUploadArea) {
                    this.handleSingleFileSelect();
                } else {
                    this.handleMultipleFileSelect();
                }
            });
        });

        // File input change events
        singleFileInput.addEventListener('change', () => this.handleSingleFileSelect());
        multipleFileInput.addEventListener('change', () => this.handleMultipleFileSelect());
    }

    handleSingleFileSelect() {
        const fileInput = document.getElementById('singleFileInput');
        const uploadBtn = document.querySelector('.upload-submit-btn');
        
        if (fileInput.files.length > 0) {
            uploadBtn.disabled = false;
            this.showToast('File selected', 'info');
        } else {
            uploadBtn.disabled = true;
        }
    }

    handleMultipleFileSelect() {
        const fileInput = document.getElementById('multipleFileInput');
        const uploadBtn = document.querySelector('.upload-submit-btn');
        
        if (fileInput.files.length > 0) {
            uploadBtn.disabled = false;
            this.showToast(`${fileInput.files.length} files selected`, 'info');
        } else {
            uploadBtn.disabled = true;
        }
    }

    setupPreviewModal() {
        const previewModal = document.getElementById('previewModal');
        
        // Close modal when clicking outside
        previewModal.addEventListener('click', (e) => {
            if (e.target === previewModal) {
                this.closePreviewModal();
            }
        });
    }

    openFilePreview(file) {
        this.currentFile = file;
        const modal = document.getElementById('previewModal');
        const title = document.getElementById('previewTitle');
        const content = document.getElementById('previewContent');

        title.textContent = file.filename;
        
        if (file.type === 'image') {
            content.innerHTML = `<img src="${file.url}" alt="${file.filename}">`;
        } else if (file.type === 'video') {
            content.innerHTML = `<video src="${file.url}" controls></video>`;
        } else {
            const icon = this.getFileIcon(file.type);
            content.innerHTML = `<div class="${file.type}"><i class="${icon}"></i><p>${file.filename}</p></div>`;
            content.className = `preview-content ${file.type}`;
        }

        modal.style.display = 'block';
    }

    closePreviewModal() {
        document.getElementById('previewModal').style.display = 'none';
        this.currentFile = null;
    }

    async downloadFile(filename, type) {
        try {
            const baseUrl = this.getBaseUrl();
        const response = await fetch(`${baseUrl}/download/${type}/${encodeURIComponent(filename)}`, {
                headers: {
                    'Authorization': `Bearer ${this.getApiKey()}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                this.showToast('File downloaded successfully', 'success');
            } else {
                throw new Error('Download failed');
            }
        } catch (error) {
            console.error('Download error:', error);
            this.showToast('Download failed', 'error');
        }
    }

    async deleteFile(filename, type) {
        if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
            return;
        }

        try {
            const baseUrl = this.getBaseUrl();
        const response = await fetch(`${baseUrl}/delete/${type}/${encodeURIComponent(filename)}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.getApiKey()}`
                }
            });

            if (response.ok) {
                this.showToast('File deleted successfully', 'success');
                this.loadFiles();
            } else {
                throw new Error('Delete failed');
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.showToast('Delete failed', 'error');
        }
    }

    shareFile(url) {
        if (navigator.share) {
            navigator.share({
                title: 'Shared File',
                url: url
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(url).then(() => {
                this.showToast('File URL copied to clipboard', 'success');
            }).catch(() => {
                this.showToast('Failed to copy URL', 'error');
            });
        }
    }

    async submitUpload() {
        const activeTab = document.querySelector('.tab-content.active');
        const isSingle = activeTab.id === 'singleTab';
        
        const fileInput = isSingle ? 
            document.getElementById('singleFileInput') : 
            document.getElementById('multipleFileInput');
        
        if (fileInput.files.length === 0) {
            this.showToast('Please select files to upload', 'warning');
            return;
        }

        const progressBar = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        progressBar.style.display = 'block';
        
        try {
            if (isSingle) {
                await this.uploadSingleFile(fileInput.files[0]);
            } else {
                await this.uploadMultipleFiles(fileInput.files);
            }
            
            this.showToast('Upload completed successfully', 'success');
            this.closeUploadModal();
            this.loadFiles();
            
        } catch (error) {
            console.error('Upload error:', error);
            this.showToast('Upload failed', 'error');
        } finally {
            progressBar.style.display = 'none';
            progressFill.style.width = '0%';
            progressText.textContent = '0%';
        }
    }

    async uploadSingleFile(file) {
        const formData = new FormData();
        const fileType = document.getElementById('singleFileType').value;
        
        formData.append('file', file);
        
        const baseUrl = this.getBaseUrl();
        const response = await fetch(`${baseUrl}/media/upload/${fileType}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.getApiKey()}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        return await response.json();
    }

    async uploadMultipleFiles(files) {
        const uploadPromises = Array.from(files).map(file => {
            const formData = new FormData();
            formData.append('file', file);
            
            // Determine file type based on extension
            const ext = file.name.split('.').pop().toLowerCase();
            let fileType = 'doc';
            
            if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) {
                fileType = 'image';
            } else if (['mp4', 'avi', 'mov', 'webm', 'mkv'].includes(ext)) {
                fileType = 'video';
            } else if (['mp3', 'wav', 'aac', 'ogg', 'flac'].includes(ext)) {
                fileType = 'audio';
            } else if (ext === 'pdf') {
                fileType = 'pdf';
            }
            
            const baseUrl = this.getBaseUrl();
            return fetch(`${baseUrl}/media/upload/${fileType}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getApiKey()}`
                },
                body: formData
            });
        });

        const responses = await Promise.all(uploadPromises);
        
        for (const response of responses) {
            if (!response.ok) {
                throw new Error('Upload failed');
            }
        }
    }

    showLoading() {
        document.getElementById('loadingState').style.display = 'flex';
        document.getElementById('fileGrid').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('fileGrid').style.display = 'grid';
    }

    showEmptyState() {
        document.getElementById('emptyState').style.display = 'flex';
        document.getElementById('fileGrid').style.display = 'none';
    }

    hideEmptyState() {
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('fileGrid').style.display = 'grid';
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        toast.innerHTML = `
            <i class="${icons[type]}"></i>
            <div class="toast-content">
                <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    getApiKey() {
        // Get API key from config
        return API_KEY;
    }

    getBaseUrl() {
        // Get base URL from config
        return API_BASE_URL;
    }

    checkAuth() {
        const loginData = localStorage.getItem('dashboard_login');
        if (!loginData) {
            this.redirectToLogin();
            return false;
        }
        
        try {
            const data = JSON.parse(loginData);
            const now = Date.now();
            
            if (!data.isLoggedIn || (now - data.timestamp) >= SESSION_TIMEOUT) {
                this.logout();
                this.redirectToLogin();
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Auth check error:', error);
            this.logout();
            this.redirectToLogin();
            return false;
        }
    }

    updateUserInfo() {
        const loginData = localStorage.getItem('dashboard_login');
        if (loginData) {
            try {
                const data = JSON.parse(loginData);
                const userElement = document.getElementById('currentUser');
                if (userElement) {
                    userElement.textContent = data.username || 'Admin';
                }
            } catch (error) {
                console.error('Error updating user info:', error);
            }
        }
    }

    logout() {
        localStorage.removeItem('dashboard_login');
        this.redirectToLogin();
    }

    redirectToLogin() {
        window.location.href = '/login';
    }
}

// Global functions for HTML onclick handlers
function openUploadModal() {
    document.getElementById('uploadModal').style.display = 'block';
}

function closeUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
    // Reset form
    document.getElementById('singleFileInput').value = '';
    document.getElementById('multipleFileInput').value = '';
    document.querySelector('.upload-submit-btn').disabled = true;
}

function closePreviewModal() {
    dashboard.closePreviewModal();
}

function loadFiles() {
    dashboard.loadFiles();
}

function downloadFile() {
    if (dashboard.currentFile) {
        dashboard.downloadFile(dashboard.currentFile.filename, dashboard.currentFile.type);
    }
}

function deleteFile() {
    if (dashboard.currentFile) {
        dashboard.deleteFile(dashboard.currentFile.filename, dashboard.currentFile.type);
        dashboard.closePreviewModal();
    }
}

function shareFile() {
    if (dashboard.currentFile) {
        dashboard.shareFile(dashboard.currentFile.url);
    }
}

function submitUpload() {
    dashboard.submitUpload();
}

// Initialize dashboard when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    const uploadModal = document.getElementById('uploadModal');
    if (e.target === uploadModal) {
        closeUploadModal();
    }
}); 