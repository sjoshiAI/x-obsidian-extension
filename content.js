console.log('X to Obsidian content script loaded');

class URLExtractor {
  constructor() {
    this.setupMessageListener();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'extractUrls') {
        this.extractUrls();
        sendResponse({ success: true });
      }
    });
  }

  extractUrls() {
    console.log('=== STARTING URL EXTRACTION ===');
    console.log('Current page URL:', window.location.href);
    console.log('Document ready state:', document.readyState);
    
    // Debug: Show what elements exist on the page
    this.debugPageStructure();
    
    // Wait for page to load completely
    setTimeout(() => {
      console.log('--- After 1 second delay ---');
      const tweets = this.getTweets();
      console.log(`Found ${tweets.length} tweets`);
      
      if (tweets.length === 0) {
        console.log('No tweets found. Trying to scroll and wait...');
        // Try scrolling to load more content
        window.scrollTo(0, document.body.scrollHeight);
        
        setTimeout(() => {
          console.log('--- After scroll and 2 second delay ---');
          const newTweets = this.getTweets();
          console.log(`After scroll, found ${newTweets.length} tweets`);
          this.processTwitters(newTweets);
        }, 2000);
      } else {
        this.processTwitters(tweets);
      }
    }, 1000);
  }

  debugPageStructure() {
    console.log('=== DEBUG: PAGE STRUCTURE ===');
    
    // Check for common X/Twitter elements
    const commonSelectors = [
      'article',
      '[data-testid]',
      '[role="article"]',
      '[role="main"]',
      'div[dir="ltr"]',
      'section',
      '.css-1dbjc4n'
    ];
    
    commonSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      console.log(`${selector}: ${elements.length} elements`);
      
      if (elements.length > 0 && elements.length < 10) {
        Array.from(elements).forEach((el, i) => {
          console.log(`  ${i+1}. ${el.tagName} - data-testid: ${el.getAttribute('data-testid')} - role: ${el.getAttribute('role')}`);
        });
      }
    });
    
    // Check for any links on the page
    const allLinks = document.querySelectorAll('a[href]');
    console.log(`Total links on page: ${allLinks.length}`);
    
    if (allLinks.length > 0) {
      console.log('Sample links:');
      Array.from(allLinks).slice(0, 5).forEach((link, i) => {
        console.log(`  ${i+1}. ${link.href} - text: "${link.textContent?.trim()?.substring(0, 50)}"`);
      });
    }
  }

  processTwitters(tweets) {
    let urlCount = 0;
    
    tweets.forEach((tweet, index) => {
      console.log(`Processing tweet ${index + 1}/${tweets.length}`);
      
      // Get all links in the tweet
      const links = tweet.querySelectorAll('a[href]');
      console.log(`Found ${links.length} links in tweet ${index + 1}`);
      
      links.forEach(link => {
        const url = link.href;
        console.log(`Checking URL: ${url}`);
        
        if (this.isValidExternalUrl(url)) {
          console.log(`Valid external URL found: ${url}`);
          
          const urlData = {
            url: this.cleanUrl(url),
            title: this.extractTitle(link, tweet),
            tweetText: this.getTweetText(tweet),
            author: this.getAuthor(tweet),
            timestamp: new Date().toISOString()
          };
          
          this.sendToBackground(urlData);
          urlCount++;
        }
      });
    });
    
    console.log(`Extracted ${urlCount} URLs`);
  }

  getTweets() {
    console.log('=== LOOKING FOR TWEETS ===');
    
    // Try multiple selectors for tweets - updated for current X structure
    const selectors = [
      'article[data-testid="tweet"]',
      '[data-testid="tweet"]', 
      'article[role="article"]',
      'div[data-testid="cellInnerDiv"]',
      '[data-testid="tweetText"]',  // Sometimes the text element is easier to find
      'article',
      'div[dir="ltr"] > div > div',  // X often uses nested divs
      '[role="article"]'
    ];
    
    let tweets = [];
    
    for (const selector of selectors) {
      tweets = document.querySelectorAll(selector);
      console.log(`Selector '${selector}': ${tweets.length} elements`);
      
      if (tweets.length > 0) {
        // Show sample of what we found
        Array.from(tweets).slice(0, 3).forEach((tweet, i) => {
          console.log(`  Sample ${i+1}: ${tweet.tagName}, testid: ${tweet.getAttribute('data-testid')}, text preview: "${tweet.textContent?.substring(0, 100)}..."`);
        });
        break;
      }
    }
    
    // If still no tweets, try a more aggressive approach
    if (tweets.length === 0) {
      console.log('No tweets found with standard selectors, trying aggressive search...');
      
      // Look for any elements that contain links
      const elementsWithLinks = document.querySelectorAll('*');
      const possibleTweets = [];
      
      Array.from(elementsWithLinks).forEach(el => {
        const links = el.querySelectorAll('a[href]');
        if (links.length > 0 && el.textContent && el.textContent.length > 20) {
          // Check if this looks like a tweet container
          const hasExternalLink = Array.from(links).some(link => 
            !link.href.includes('twitter.com') && 
            !link.href.includes('x.com') && 
            !link.href.includes('t.co')
          );
          
          if (hasExternalLink) {
            possibleTweets.push(el);
          }
        }
      });
      
      console.log(`Found ${possibleTweets.length} elements with external links that could be tweets`);
      tweets = possibleTweets;
    }
    
    console.log(`=== FINAL RESULT: ${tweets.length} tweet elements ===`);
    return Array.from(tweets);
  }

  isValidExternalUrl(url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // INCLUDE t.co links (these are shortened external URLs)
      if (hostname === 't.co') {
        console.log(`✅ Found t.co link (shortened URL): ${url}`);
        return true;
      }
      
      // Skip only Twitter/X internal domains
      const excludedDomains = [
        'twitter.com',
        'x.com', 
        'pic.twitter.com'
      ];
      
      // Skip internal Twitter URLs (profiles, status pages, etc.)
      if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
        // Allow if it's NOT a user profile or status page
        if (url.includes('/status/') || url.includes('/analytics') || url.includes('/photo/')) {
          console.log(`❌ Skipping Twitter internal link: ${url}`);
          return false;
        }
      }
      
      const isExternal = !excludedDomains.some(domain => hostname.includes(domain));
      const isHttps = urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
      
      const result = isExternal && isHttps;
      if (result) {
        console.log(`✅ Valid external URL: ${url}`);
      } else {
        console.log(`❌ Filtered out: ${url} (external: ${isExternal}, https: ${isHttps})`);
      }
      
      return result;
    } catch (error) {
      console.log(`❌ URL parsing error for: ${url} - ${error.message}`);
      return false;
    }
  }

  cleanUrl(url) {
    try {
      const urlObj = new URL(url);
      // Remove tracking parameters
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
      trackingParams.forEach(param => {
        urlObj.searchParams.delete(param);
      });
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  extractTitle(link, tweet) {
    // Try to get a meaningful title
    let title = link.textContent?.trim();
    
    if (!title || title.includes('http') || title.length < 3) {
      // Try to get title from tweet text
      const tweetText = this.getTweetText(tweet);
      if (tweetText) {
        // Take first 50 chars as title
        title = tweetText.substring(0, 50).trim();
        if (title.length === 50) title += '...';
      }
    }
    
    return title || new URL(link.href).hostname;
  }

  getTweetText(tweet) {
    const textElement = tweet.querySelector('[data-testid="tweetText"]');
    return textElement ? textElement.textContent.trim() : '';
  }

  getAuthor(tweet) {
    // Try different selectors for author
    let authorElement = tweet.querySelector('[data-testid="User-Name"]');
    if (!authorElement) {
      authorElement = tweet.querySelector('a[role="link"] span');
    }
    
    if (authorElement) {
      const text = authorElement.textContent;
      // Extract username if present
      const match = text.match(/@\w+/);
      return match ? match[0] : text.split(' ')[0];
    }
    
    return 'Unknown';
  }

  sendToBackground(urlData) {
    chrome.runtime.sendMessage({
      action: 'saveUrl',
      data: urlData
    }).catch(error => {
      console.error('Error sending URL to background:', error);
    });
  }
}

// Initialize
new URLExtractor();