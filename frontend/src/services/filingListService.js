// =====================================================
// ITR FILING PLATFORM - FRONTEND SERVICES
// Phase 1: Foundation Setup - Frontend Components
// Following BUSINESS_TECHNICAL_BRIDGE specifications
// =====================================================

import { getApiBaseUrl } from '../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

// =====================================================
// API CLIENT UTILITY
// =====================================================

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('authToken');

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

const apiClient = new ApiClient();

// =====================================================
// FILING LIST SERVICE
// =====================================================

export const filingListService = {
  // Get filings for authenticated user
  async getFilings(userId, userRole, filters = {}) {
    try {
      const params = {
        ...filters,
        userId,
        role: userRole,
      };

      const response = await apiClient.get('/filings', params);

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch filings');
      }
    } catch (error) {
      console.error('Error fetching filings:', error);
      throw error;
    }
  },

  // Get specific filing by ID
  async getFilingById(filingId, userId, userRole) {
    try {
      const response = await apiClient.get(`/filings/${filingId}`);

      if (response.success) {
        return response.data.filing;
      } else {
        throw new Error(response.message || 'Failed to fetch filing');
      }
    } catch (error) {
      console.error('Error fetching filing:', error);
      throw error;
    }
  },

  // Create new filing
  async createFiling(filingData) {
    try {
      const response = await apiClient.post('/filings', filingData);

      if (response.success) {
        return response.data.filing;
      } else {
        throw new Error(response.message || 'Failed to create filing');
      }
    } catch (error) {
      console.error('Error creating filing:', error);
      throw error;
    }
  },

  // Update filing
  async updateFiling(filingId, updateData) {
    try {
      const response = await apiClient.put(`/filings/${filingId}`, updateData);

      if (response.success) {
        return response.data.filing;
      } else {
        throw new Error(response.message || 'Failed to update filing');
      }
    } catch (error) {
      console.error('Error updating filing:', error);
      throw error;
    }
  },

  // Delete filing
  async deleteFiling(filingId) {
    try {
      const response = await apiClient.delete(`/filings/${filingId}`);

      if (response.success) {
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete filing');
      }
    } catch (error) {
      console.error('Error deleting filing:', error);
      throw error;
    }
  },
};

// =====================================================
// SERVICE TICKET SERVICE
// =====================================================

export const serviceTicketService = {
  // Get service tickets for authenticated user
  async getServiceTickets(userId, userRole) {
    try {
      const params = {
        userId,
        role: userRole,
      };

      const response = await apiClient.get('/tickets', params);

      if (response.success) {
        return response.data.tickets;
      } else {
        throw new Error(response.message || 'Failed to fetch service tickets');
      }
    } catch (error) {
      console.error('Error fetching service tickets:', error);
      throw error;
    }
  },

  // Get specific service ticket by ID
  async getServiceTicketById(ticketId, userId, userRole) {
    try {
      const response = await apiClient.get(`/tickets/${ticketId}`);

      if (response.success) {
        return response.data.ticket;
      } else {
        throw new Error(response.message || 'Failed to fetch service ticket');
      }
    } catch (error) {
      console.error('Error fetching service ticket:', error);
      throw error;
    }
  },

  // Update service ticket status
  async updateTicketStatus(ticketId, status) {
    try {
      const response = await apiClient.put(`/tickets/${ticketId}/status`, { status });

      if (response.success) {
        return response.data.ticket;
      } else {
        throw new Error(response.message || 'Failed to update ticket status');
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      throw error;
    }
  },
};

// =====================================================
// PAN VALIDATION SERVICE
// =====================================================

export const panValidationService = {
  // Validate PAN
  async validatePAN(pan, context) {
    try {
      const response = await apiClient.post('/pan/validate', {
        pan: pan.toUpperCase(),
        context,
      });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to validate PAN');
      }
    } catch (error) {
      console.error('Error validating PAN:', error);
      throw error;
    }
  },
};

// =====================================================
// BILLING SERVICE
// =====================================================

export const billingService = {
  // Create service ticket for billing
  async createServiceTicket(filingId, context) {
    try {
      const response = await apiClient.post('/billing/tickets', {
        filingId,
        context,
      });

      if (response.success) {
        return response.data.ticket;
      } else {
        throw new Error(response.message || 'Failed to create service ticket');
      }
    } catch (error) {
      console.error('Error creating service ticket:', error);
      throw error;
    }
  },

  // Process payment
  async processPayment(serviceTicketId, paymentData) {
    try {
      const response = await apiClient.post('/billing/payment', {
        serviceTicketId,
        paymentData,
      });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to process payment');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  },

  // Get billing summary
  async getBillingSummary(userId, userRole) {
    try {
      const params = {
        userId,
        role: userRole,
      };

      const response = await apiClient.get('/billing/summary', params);

      if (response.success) {
        return response.data.summary;
      } else {
        throw new Error(response.message || 'Failed to fetch billing summary');
      }
    } catch (error) {
      console.error('Error fetching billing summary:', error);
      throw error;
    }
  },
};

// =====================================================
// AUTHENTICATION SERVICE
// =====================================================

export const authService = {
  // Login user
  async login(email, password) {
    try {
      const response = await apiClient.post('/api/auth/login', {
        email,
        password,
      });

      if (response.success) {
        const { token, user } = response.data;
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        return { token, user };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Register user
  async register(userData) {
    try {
      const response = await apiClient.post('/api/auth/register', userData);

      if (response.success) {
        const { token, user } = response.data;
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        return { token, user };
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Logout user
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('authToken');
    return !!token;
  },
};

// =====================================================
// ERROR HANDLING UTILITY
// =====================================================

export const handleApiError = (error) => {
  if (error.message.includes('401')) {
    // Unauthorized - redirect to login
    authService.logout();
    window.location.href = '/login';
  } else if (error.message.includes('403')) {
    // Forbidden - show access denied message
    return 'Access denied. You do not have permission to perform this action.';
  } else if (error.message.includes('404')) {
    // Not found
    return 'The requested resource was not found.';
  } else if (error.message.includes('500')) {
    // Server error
    return 'A server error occurred. Please try again later.';
  } else {
    // Generic error
    return error.message || 'An unexpected error occurred.';
  }
};

// =====================================================
// EXPORT DEFAULT API CLIENT
// =====================================================

export default apiClient;
