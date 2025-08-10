class PopupController {
  constructor() {
    this.urls = [];
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadUrls();
    this.updateUI();
  }

  setupEventListeners() {
    document.getElementById('extractBtn').addEventListener('click', () => {
      this.extractUrls();
    });

    document.getElementById('exportBtn').addEventListener('click', () => {
      this.exportUrls();
    });

    document.getElementById('clearBtn').addEventListener('click', () => {
      this.clearUrls();
    });
  }

  async loadUrls() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getUrls' });
      if (response && response.success) {
        this.urls = response.urls || [];
      }
    } catch (error) {
      console.error('Error loading URLs:', error);
      this.showStatus('Error loading URLs', 'error');
    }
  }

  async extractUrls() {
    const extractBtn = document.getElementById('extractBtn');
    const originalText = extractBtn.textContent;
    
    extractBtn.disabled = true;
    extractBtn.textContent = '⏳ Extracting...';

    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Check if we're on X/Twitter
      if (!tab.url.includes('twitter.com') && !tab.url.includes('x.com')) {
        this.showStatus('Please navigate to X (Twitter) first!', 'error');
        return;
      }

      // Send message to content script
      await chrome.tabs.sendMessage(tab.id, { action: 'extractUrls' });
      
      // Wait a moment and reload URLs
      setTimeout(async () => {
        await this.loadUrls();
        this.updateUI();
        
        const newCount = this.urls.length;
        if (newCount > 0) {
          this.showStatus(`✅ Found ${newCount} URLs!`, 'success');
        } else {
          this.showStatus('No external URLs found in current tweets', 'error');
        }
      }, 1500);

    } catch (error) {
      console.error('Error extracting URLs:', error);
      this.showStatus('Error: Try refreshing the page and try again', 'error');
    } finally {
      extractBtn.disabled = false;
      extractBtn.textContent = originalText;
    }
  }

  async exportUrls() {
    if (this.urls.length === 0) {
      this.showStatus('No URLs to export!', 'error');
      return;
    }

    const exportBtn = document.getElementById('exportBtn');
    const originalText = exportBtn.textContent;
    
    exportBtn.disabled = true;
    exportBtn.textContent = '⏳ Exporting...';

    try {
      const response = await chrome.runtime.sendMessage({ action: 'exportUrls' });
      
      if (response && response.success) {
        this.showStatus(`✅ Exported ${response.count} URLs to ${response.filename}`, 'success');
      } else {
        this.showStatus(`❌ Export failed: ${response.error}`, 'error');
      }
    } catch (error) {
      console.error('Error exporting:', error);
      this.showStatus('❌ Export failed', 'error');
    } finally {
      exportBtn.disabled = false;
      exportBtn.textContent = originalText;
    }
  }

  async clearUrls() {
    if (this.urls.length === 0) {
      return;
    }

    if (!confirm(`Clear all ${this.urls.length} URLs?`)) {
      return;
    }

    try {
      await chrome.runtime.sendMessage({ action: 'clearUrls' });
      this.urls = [];
      this.updateUI();
      this.showStatus('✅ All URLs cleared', 'success');
    } catch (error) {
      console.error('Error clearing URLs:', error);
      this.showStatus('❌ Error clearing URLs', 'error');
    }
  }

  updateUI() {
    // Update count
    document.getElementById('urlCount').textContent = this.urls.length;
    
    // Update export button state
    document.getElementById('exportBtn').disabled = this.urls.length === 0;
    
    // Update URL preview
    const preview = document.getElementById('urlPreview');
    
    if (this.urls.length === 0) {
      preview.innerHTML = `
        <div class="empty-state">
          No URLs found yet.<br>
          Go to X (Twitter) and click "Extract URLs".
        </div>
      `;
    } else {
      // Show first 5 URLs
      const displayUrls = this.urls.slice(0, 5);
      
      preview.innerHTML = displayUrls.map(url => `
        <div class="url-item">
          <div class="url-title">${this.truncate(url.title, 45)}</div>
          <a href="${url.url}" class="url-link" target="_blank">${this.truncate(url.url, 50)}</a>
          <div class="url-author">by ${url.author}</div>
        </div>
      `).join('');
      
      if (this.urls.length > 5) {
        preview.innerHTML += `
          <div style="text-align: center; padding: 10px; font-size: 11px; color: #666;">
            ... and ${this.urls.length - 5} more URLs
          </div>
        `;
      }
    }
  }

  showStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      status.className = 'status';
    }, 5000);
  }

  truncate(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});