// =====================================================
// ITR FILING PLATFORM - ENTERPRISE STATE MANAGEMENT
// Phase 2: Frontend State Management - Enterprise Implementation
// Advanced state management with React Query, Zustand, and JavaScript
// =====================================================

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuthStore } from './authStore';

// =====================================================
// API CLIENT CONFIGURATION
// =====================================================

import { getApiBaseUrl } from '../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.accessToken = null;
  }

  setAccessToken(token) {
    this.accessToken = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Create API client instance
const apiClient = new ApiClient(API_BASE_URL);

// =====================================================
// ZUSTAND STORES
// =====================================================
export const useFilingListStore = create(
  devtools(
    immer((set, get) => ({
      filings: [],
      totalCount: 0,
      currentPage: 1,
      totalPages: 0,
      filters: {
        status: '',
        itrType: '',
        year: '',
        search: '',
        context: '',
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      },
      isLoading: false,
      error: null,
      selectedFiling: null,

      setFilings: (filings, totalCount, currentPage, totalPages) => {
        set((state) => {
          state.filings = filings;
          state.totalCount = totalCount;
          state.currentPage = currentPage;
          state.totalPages = totalPages;
        });
      },

      setFilters: (filters) => {
        set((state) => {
          state.filters = { ...state.filters, ...filters };
        });
      },

      setSelectedFiling: (filing) => {
        set((state) => {
          state.selectedFiling = filing;
        });
      },

      setLoading: (loading) => {
        set((state) => {
          state.isLoading = loading;
        });
      },

      setError: (error) => {
        set((state) => {
          state.error = error;
        });
      },

      clearFilings: () => {
        set((state) => {
          state.filings = [];
          state.totalCount = 0;
          state.currentPage = 1;
          state.totalPages = 0;
          state.selectedFiling = null;
        });
      },

      updateFiling: (filingId, updates) => {
        set((state) => {
          const index = state.filings.findIndex(filing => filing.id === filingId);
          if (index !== -1) {
            state.filings[index] = { ...state.filings[index], ...updates };
          }

          if (state.selectedFiling && state.selectedFiling.id === filingId) {
            state.selectedFiling = { ...state.selectedFiling, ...updates };
          }
        });
      },

      removeFiling: (filingId) => {
        set((state) => {
          state.filings = state.filings.filter(filing => filing.id !== filingId);
          state.totalCount = Math.max(0, state.totalCount - 1);

          if (state.selectedFiling && state.selectedFiling.id === filingId) {
            state.selectedFiling = null;
          }
        });
      },
    })),
    {
      name: 'filing-list-store',
    },
  ),
);

// Service Ticket Store
export const useServiceTicketStore = create(
  devtools(
    immer((set, get) => ({
      tickets: [],
      totalCount: 0,
      currentPage: 1,
      totalPages: 0,
      filters: {
        status: '',
        priority: '',
        billingStatus: '',
        page: 1,
        limit: 10,
      },
      isLoading: false,
      error: null,
      selectedTicket: null,

      setTickets: (tickets, totalCount, currentPage, totalPages) => {
        set((state) => {
          state.tickets = tickets;
          state.totalCount = totalCount;
          state.currentPage = currentPage;
          state.totalPages = totalPages;
        });
      },

      setFilters: (filters) => {
        set((state) => {
          state.filters = { ...state.filters, ...filters };
        });
      },

      setSelectedTicket: (ticket) => {
        set((state) => {
          state.selectedTicket = ticket;
        });
      },

      setLoading: (loading) => {
        set((state) => {
          state.isLoading = loading;
        });
      },

      setError: (error) => {
        set((state) => {
          state.error = error;
        });
      },

      clearTickets: () => {
        set((state) => {
          state.tickets = [];
          state.totalCount = 0;
          state.currentPage = 1;
          state.totalPages = 0;
          state.selectedTicket = null;
        });
      },

      updateTicket: (ticketId, updates) => {
        set((state) => {
          const index = state.tickets.findIndex(ticket => ticket.id === ticketId);
          if (index !== -1) {
            state.tickets[index] = { ...state.tickets[index], ...updates };
          }

          if (state.selectedTicket && state.selectedTicket.id === ticketId) {
            state.selectedTicket = { ...state.selectedTicket, ...updates };
          }
        });
      },

      removeTicket: (ticketId) => {
        set((state) => {
          state.tickets = state.tickets.filter(ticket => ticket.id !== ticketId);
          state.totalCount = Math.max(0, state.totalCount - 1);

          if (state.selectedTicket && state.selectedTicket.id === ticketId) {
            state.selectedTicket = null;
          }
        });
      },
    })),
    {
      name: 'service-ticket-store',
    },
  ),
);

// Dashboard Store
export const useDashboardStore = create(
  devtools(
    immer((set, get) => ({
      summary: null,
      isLoading: false,
      error: null,
      lastUpdated: null,

      setSummary: (summary) => {
        set((state) => {
          state.summary = summary;
          state.lastUpdated = new Date().toISOString();
        });
      },

      setLoading: (loading) => {
        set((state) => {
          state.isLoading = loading;
        });
      },

      setError: (error) => {
        set((state) => {
          state.error = error;
        });
      },

      clearDashboard: () => {
        set((state) => {
          state.summary = null;
          state.lastUpdated = null;
        });
      },

      refreshDashboard: async () => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await apiClient.get('/dashboard/summary');

          if (response.success) {
            set((state) => {
              state.summary = response.data;
              state.lastUpdated = new Date().toISOString();
              state.isLoading = false;
            });
          } else {
            throw new Error(response.message || 'Failed to load dashboard');
          }
        } catch (error) {
          const message = error.message || 'Failed to load dashboard';
          toast.error(message);

          set((state) => {
            state.isLoading = false;
            state.error = message;
          });

          throw error;
        }
      },
    })),
    {
      name: 'dashboard-store',
    },
  ),
);

// App Store
export const useAppStore = create(
  devtools(
    persist(
      immer((set, get) => ({
        theme: 'light',
        sidebarCollapsed: false,
        currentRoute: '/',
        isLoading: false,
        error: null,

        setTheme: (theme) => {
          set((state) => {
            state.theme = theme;
          });
        },

        setSidebarCollapsed: (collapsed) => {
          set((state) => {
            state.sidebarCollapsed = collapsed;
          });
        },

        setCurrentRoute: (route) => {
          set((state) => {
            state.currentRoute = route;
          });
        },

        setLoading: (loading) => {
          set((state) => {
            state.isLoading = loading;
          });
        },

        setError: (error) => {
          set((state) => {
            state.error = error;
          });
        },

        clearError: () => {
          set((state) => {
            state.error = null;
          });
        },
      })),
      {
        name: 'app-store',
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      },
    ),
    {
      name: 'app-store',
    },
  ),
);

// =====================================================
// REACT QUERY CONFIGURATION
// =====================================================

// Create QueryClient instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// QueryClient Provider Component
export const QueryProvider = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

// =====================================================
// CUSTOM HOOKS
// =====================================================

// Auth hooks
export const useAuth = () => {
  const store = useAuthStore();
  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    login: store.login,
    register: store.register,
    logout: store.logout,
    refreshAccessToken: store.refreshAccessToken,
    sendRegistrationOTP: store.sendRegistrationOTP,
    sendPasswordResetOTP: store.sendPasswordResetOTP,
    resetPassword: store.resetPassword,
    clearAuth: store.clearAuth,
  };
};

// Filing hooks
export const useFilingList = () => {
  const store = useFilingListStore();
  return {
    filings: store.filings,
    totalCount: store.totalCount,
    currentPage: store.currentPage,
    totalPages: store.totalPages,
    filters: store.filters,
    isLoading: store.isLoading,
    error: store.error,
    selectedFiling: store.selectedFiling,
    setFilings: store.setFilings,
    setFilters: store.setFilters,
    setSelectedFiling: store.setSelectedFiling,
    setLoading: store.setLoading,
    setError: store.setError,
    clearFilings: store.clearFilings,
    updateFiling: store.updateFiling,
    removeFiling: store.removeFiling,
  };
};

// Service ticket hooks
export const useServiceTickets = () => {
  const store = useServiceTicketStore();
  return {
    tickets: store.tickets,
    totalCount: store.totalCount,
    currentPage: store.currentPage,
    totalPages: store.totalPages,
    filters: store.filters,
    isLoading: store.isLoading,
    error: store.error,
    selectedTicket: store.selectedTicket,
    setTickets: store.setTickets,
    setFilters: store.setFilters,
    setSelectedTicket: store.setSelectedTicket,
    setLoading: store.setLoading,
    setError: store.setError,
    clearTickets: store.clearTickets,
    updateTicket: store.updateTicket,
    removeTicket: store.removeTicket,
  };
};

// Dashboard hooks
export const useDashboard = () => {
  const store = useDashboardStore();
  return {
    summary: store.summary,
    isLoading: store.isLoading,
    error: store.error,
    lastUpdated: store.lastUpdated,
    setSummary: store.setSummary,
    setLoading: store.setLoading,
    setError: store.setError,
    clearDashboard: store.clearDashboard,
    refreshDashboard: store.refreshDashboard,
  };
};

// App hooks
export const useApp = () => {
  const store = useAppStore();
  return {
    theme: store.theme,
    sidebarCollapsed: store.sidebarCollapsed,
    currentRoute: store.currentRoute,
    isLoading: store.isLoading,
    error: store.error,
    setTheme: store.setTheme,
    setSidebarCollapsed: store.setSidebarCollapsed,
    setCurrentRoute: store.setCurrentRoute,
    setLoading: store.setLoading,
    setError: store.setError,
    clearError: store.clearError,
  };
};

// =====================================================
// EXPORTS
// =====================================================

// Export useAuthStore for hooks compatibility
export { useAuthStore };

// Export default object
const storeExports = {
  useAuthStore,
  useFilingListStore,
  useServiceTicketStore,
  useDashboardStore,
  useAppStore,
  queryClient,
  QueryProvider,
  apiClient,
};

export default storeExports;
