// =====================================================
// STORAGE SERVICE
// Utility service for local storage management
// =====================================================

class StorageService {
  constructor() {
    this.prefix = 'burnblack_';
    this.defaultExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Set item with optional expiry
  setItem(key, value, expiryMs = null) {
    const item = {
      value,
      timestamp: Date.now(),
      expiry: expiryMs ? Date.now() + expiryMs : null,
    };

    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  // Get item, checking expiry
  getItem(key, defaultValue = null) {
    try {
      const itemStr = localStorage.getItem(this.prefix + key);
      if (!itemStr) return defaultValue;

      const item = JSON.parse(itemStr);

      // Check if item has expired
      if (item.expiry && Date.now() > item.expiry) {
        this.removeItem(key);
        return defaultValue;
      }

      return item.value;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return defaultValue;
    }
  }

  // Remove item
  removeItem(key) {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }

  // Clear all app items
  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  // Clear expired items
  clearExpired() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          const itemStr = localStorage.getItem(key);
          if (itemStr) {
            const item = JSON.parse(itemStr);
            if (item.expiry && Date.now() > item.expiry) {
              localStorage.removeItem(key);
            }
          }
        }
      });
    } catch (error) {
      console.warn('Failed to clear expired items:', error);
    }
  }

  // Get storage size
  getStorageSize() {
    let total = 0;
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          total += localStorage.getItem(key).length;
        }
      });
    } catch (error) {
      console.warn('Failed to calculate storage size:', error);
    }
    return total;
  }

  // Specific methods for common data types
  setUser(user) {
    this.setItem('user', user, this.defaultExpiry);
  }

  getUser() {
    return this.getItem('user');
  }

  removeUser() {
    this.removeItem('user');
  }

  setAuthToken(token) {
    this.setItem('authToken', token, this.defaultExpiry);
  }

  getAuthToken() {
    return this.getItem('authToken');
  }

  removeAuthToken() {
    this.removeItem('authToken');
  }

  setRefreshToken(token) {
    this.setItem('refreshToken', token, this.defaultExpiry * 7); // 7 days
  }

  getRefreshToken() {
    return this.getItem('refreshToken');
  }

  removeRefreshToken() {
    this.removeItem('refreshToken');
  }

  setPreferences(preferences) {
    this.setItem('preferences', preferences);
  }

  getPreferences(defaultPrefs = {}) {
    return this.getItem('preferences', defaultPrefs);
  }

  setDraft(draftId, draftData) {
    this.setItem(`draft_${draftId}`, draftData, this.defaultExpiry * 7); // 7 days
  }

  getDraft(draftId) {
    return this.getItem(`draft_${draftId}`);
  }

  removeDraft(draftId) {
    this.removeItem(`draft_${draftId}`);
  }

  setFormData(formId, formData) {
    this.setItem(`form_${formId}`, formData, this.defaultExpiry);
  }

  getFormData(formId) {
    return this.getItem(`form_${formId}`);
  }

  removeFormData(formId) {
    this.removeItem(`form_${formId}`);
  }
}

// Create singleton instance
const storageService = new StorageService();

// Start expired items cleanup
storageService.clearExpired();
setInterval(() => storageService.clearExpired(), 60 * 60 * 1000); // Every hour

export default storageService;

