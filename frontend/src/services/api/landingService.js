// =====================================================
// LANDING SERVICE
// Landing page data operations using unified API client
// =====================================================

import apiClient from '../core/APIClient';
import errorHandler from '../core/ErrorHandler';

class LandingService {
  /**
   * Get public stats for landing page
   * @returns {Promise<Object>} Stats data
   */
  async getStats() {
    try {
      const response = await apiClient.get('/public/stats');
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get public testimonials for landing page
   * @returns {Promise<Array>} Testimonials array
   */
  async getTestimonials() {
    try {
      const response = await apiClient.get('/public/testimonials');
      return response.data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }
}

// Create singleton instance
const landingService = new LandingService();

export default landingService;

