// =====================================================
// DEVICE DETECTION SERVICE
// Parses userAgent to extract device information
// =====================================================

const enterpriseLogger = require('../../utils/logger');

class DeviceDetectionService {
  /**
   * Parse userAgent string to extract device information
   * @param {string} userAgent - User agent string
   * @param {string} ipAddress - IP address (optional, for location)
   * @returns {object} - Device information
   */
  parseDeviceInfo(userAgent, ipAddress = null) {
    if (!userAgent) {
      return {
        deviceType: 'unknown',
        deviceName: 'Unknown Device',
        browser: 'Unknown',
        os: 'Unknown',
        location: null,
      };
    }

    const ua = userAgent.toLowerCase();

    // Detect device type
    let deviceType = 'desktop';
    let deviceName = 'Desktop';

    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
      deviceType = 'mobile';
      deviceName = this.detectMobileDevice(ua);
    } else if (/tablet|ipad|playbook|silk/i.test(ua)) {
      deviceType = 'tablet';
      deviceName = this.detectTabletDevice(ua);
    } else {
      deviceName = this.detectDesktopDevice(ua);
    }

    // Detect browser
    const browser = this.detectBrowser(ua);

    // Detect OS
    const os = this.detectOS(ua);

    // Location will be determined by IP geolocation if needed (optional)
    const location = null; // Can be enhanced with IP geolocation service

    return {
      deviceType,
      deviceName,
      browser,
      os,
      location,
    };
  }

  /**
   * Detect mobile device name
   * @param {string} ua - Lowercase user agent
   * @returns {string} - Device name
   */
  detectMobileDevice(ua) {
    if (ua.includes('iphone')) {
      const match = ua.match(/iphone\s*os\s*(\d+)/);
      if (match) {
        const version = match[1];
        // Map iOS versions to iPhone models (simplified)
        if (version >= '17') return 'iPhone 15';
        if (version >= '16') return 'iPhone 14';
        if (version >= '15') return 'iPhone 13';
        if (version >= '14') return 'iPhone 12';
        if (version >= '13') return 'iPhone 11';
      }
      return 'iPhone';
    }
    if (ua.includes('android')) {
      const match = ua.match(/android\s+(\d+\.?\d*)/);
      if (match) {
        return `Android ${match[1]}`;
      }
      return 'Android Phone';
    }
    if (ua.includes('samsung')) return 'Samsung Phone';
    if (ua.includes('oneplus')) return 'OnePlus';
    if (ua.includes('xiaomi')) return 'Xiaomi';
    if (ua.includes('oppo')) return 'Oppo';
    if (ua.includes('vivo')) return 'Vivo';
    return 'Mobile Device';
  }

  /**
   * Detect tablet device name
   * @param {string} ua - Lowercase user agent
   * @returns {string} - Device name
   */
  detectTabletDevice(ua) {
    if (ua.includes('ipad')) {
      return 'iPad';
    }
    if (ua.includes('android')) {
      return 'Android Tablet';
    }
    if (ua.includes('kindle')) return 'Kindle';
    if (ua.includes('silk')) return 'Kindle Fire';
    return 'Tablet';
  }

  /**
   * Detect desktop device name
   * @param {string} ua - Lowercase user agent
   * @returns {string} - Device name
   */
  detectDesktopDevice(ua) {
    if (ua.includes('windows')) {
      if (ua.includes('windows nt 10')) return 'Windows PC';
      if (ua.includes('windows nt 6.3')) return 'Windows 8.1 PC';
      if (ua.includes('windows nt 6.2')) return 'Windows 8 PC';
      if (ua.includes('windows nt 6.1')) return 'Windows 7 PC';
      return 'Windows PC';
    }
    if (ua.includes('mac os')) {
      return 'Mac';
    }
    if (ua.includes('linux')) {
      return 'Linux PC';
    }
    return 'Desktop';
  }

  /**
   * Detect browser name and version
   * @param {string} ua - Lowercase user agent
   * @returns {string} - Browser name
   */
  detectBrowser(ua) {
    if (ua.includes('edg/')) return 'Edge';
    if (ua.includes('chrome/') && !ua.includes('edg/')) {
      const match = ua.match(/chrome\/(\d+)/);
      return match ? `Chrome ${match[1]}` : 'Chrome';
    }
    if (ua.includes('firefox/')) {
      const match = ua.match(/firefox\/(\d+)/);
      return match ? `Firefox ${match[1]}` : 'Firefox';
    }
    if (ua.includes('safari/') && !ua.includes('chrome/')) {
      const match = ua.match(/version\/(\d+)/);
      return match ? `Safari ${match[1]}` : 'Safari';
    }
    if (ua.includes('opera/') || ua.includes('opr/')) return 'Opera';
    if (ua.includes('msie') || ua.includes('trident/')) return 'Internet Explorer';
    return 'Unknown Browser';
  }

  /**
   * Detect operating system
   * @param {string} ua - Lowercase user agent
   * @returns {string} - OS name
   */
  detectOS(ua) {
    if (ua.includes('windows nt 10')) return 'Windows 10/11';
    if (ua.includes('windows nt 6.3')) return 'Windows 8.1';
    if (ua.includes('windows nt 6.2')) return 'Windows 8';
    if (ua.includes('windows nt 6.1')) return 'Windows 7';
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac os')) {
      const match = ua.match(/mac os x\s+(\d+[._]\d+)/);
      return match ? `macOS ${match[1].replace('_', '.')}` : 'macOS';
    }
    if (ua.includes('android')) {
      const match = ua.match(/android\s+(\d+\.?\d*)/);
      return match ? `Android ${match[1]}` : 'Android';
    }
    if (ua.includes('iphone os')) {
      const match = ua.match(/iphone\s*os\s*(\d+[._]\d+)/);
      return match ? `iOS ${match[1].replace('_', '.')}` : 'iOS';
    }
    if (ua.includes('ipad os')) {
      const match = ua.match(/ipad.*os\s*(\d+[._]\d+)/);
      return match ? `iPadOS ${match[1].replace('_', '.')}` : 'iPadOS';
    }
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('ubuntu')) return 'Ubuntu';
    return 'Unknown OS';
  }

  /**
   * Get location from IP address (optional - can integrate with geolocation service)
   * @param {string} ipAddress - IP address
   * @returns {Promise<string|null>} - Location string or null
   */
  async getLocationFromIP(ipAddress) {
    // This is a placeholder - can integrate with services like:
    // - ipapi.co
    // - ip-api.com
    // - MaxMind GeoIP2
    // For now, return null
    return null;
  }
}

module.exports = new DeviceDetectionService();

