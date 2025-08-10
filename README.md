# 🔗 X to Obsidian Chrome Extension

A Chrome extension that extracts URLs from your liked tweets on X (Twitter) and exports them as beautifully formatted reading lists for Obsidian.

## ✨ Features

- **Smart URL Extraction**: Finds external URLs in liked tweets and posts
- **t.co Link Support**: Automatically detects Twitter's shortened URLs
- **Clean Export**: Removes tracking parameters and generates organized markdown
- **Domain Grouping**: Groups URLs by website in exported files
- **Local Storage**: Persistent storage across browser sessions
- **Modern UI**: Clean, responsive popup interface

## 🚀 Installation

### Load Unpacked Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select this project folder
5. The extension icon will appear in your toolbar

## 📖 How to Use

1. **Navigate to X/Twitter**: Go to your likes page or any page with tweets
2. **Extract URLs**: Click the extension icon and hit "Extract URLs"
3. **View Results**: See found URLs in the popup preview
4. **Export**: Click "Export to Obsidian" to download markdown file
5. **Import to Obsidian**: Drag the downloaded file into your Obsidian vault

## 🎨 Export Format

Generated markdown files include:
- Organized sections grouped by domain
- Tweet context and author information
- Clean URLs with tracking parameters removed
- Obsidian-optimized formatting with tags and metadata

## 🔧 Technical Details

### Files Structure
- `manifest.json` - Chrome extension configuration
- `content.js` - URL extraction logic for X/Twitter pages
- `background.js` - Storage and export functionality
- `popup.html/js` - User interface and controls

### Supported URLs
- ✅ External website links (GitHub, Medium, etc.)
- ✅ t.co shortened URLs from Twitter
- ❌ Internal Twitter links (profiles, tweet pages)

## 🛠️ Development

### Prerequisites
- Chrome browser
- Basic knowledge of Chrome extensions

### Setup
1. Clone this repository
2. Load as unpacked extension in Chrome
3. Make changes and refresh extension to test

### Debugging
- Open Chrome DevTools on X/Twitter pages
- Check console for detailed extraction logs
- Use popup to monitor URL collection

## 📄 License

MIT License - feel free to modify and distribute.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Found this useful?** ⭐ Star the repository!  
**Issues?** 🐛 [Report them here](https://github.com/YOUR_USERNAME/x-obsidian-extension/issues)