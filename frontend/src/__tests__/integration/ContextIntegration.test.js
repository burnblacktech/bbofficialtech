// =====================================================
// INTEGRATION TESTS - CONTEXT MANAGEMENT
// Tests the new 4-context strategy
// =====================================================

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ITRProvider, useITR } from '../contexts/ITRContext';
import { AppProvider, useApp } from '../contexts/AppContext';
import { NotificationProvider, useNotification } from '../contexts/NotificationContext';

// Test wrapper components
const TestAuthComponent = () => {
  const { user, login, logout, isAuthenticated } = useAuth();

  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? `Authenticated as ${user.name}` : 'Not authenticated'}
      </div>
      <button
        onClick={() => login({ email: 'test@example.com', password: 'password' })}
        data-testid="login-btn"
      >
        Login
      </button>
      <button onClick={logout} data-testid="logout-btn">
        Logout
      </button>
    </div>
  );
};

const TestITRComponent = () => {
  const {
    currentFiling,
    filings,
    createFiling,
    updateFilingSection,
    getFilingProgress
  } = useITR();

  return (
    <div>
      <div data-testid="filing-count">
        {filings.length} filings
      </div>
      <div data-testid="current-filing">
        {currentFiling ? `Current: ${currentFiling.type}` : 'No current filing'}
      </div>
      <button
        onClick={() => createFiling({ type: 'ITR-1', assessmentYear: '2024-25' })}
        data-testid="create-filing-btn"
      >
        Create Filing
      </button>
      <button
        onClick={() => updateFilingSection('personal', { name: 'Test User' })}
        data-testid="update-section-btn"
      >
        Update Section
      </button>
    </div>
  );
};

const TestAppComponent = () => {
  const { state, updateSettings, toggleTheme } = useApp();

  return (
    <div>
      <div data-testid="theme">
        Theme: {state.theme}
      </div>
      <div data-testid="language">
        Language: {state.language}
      </div>
      <button onClick={toggleTheme} data-testid="toggle-theme-btn">
        Toggle Theme
      </button>
      <button
        onClick={() => updateSettings({ language: 'hi' })}
        data-testid="update-language-btn"
      >
        Update Language
      </button>
    </div>
  );
};

const TestNotificationComponent = () => {
  const { notifications, addNotification, removeNotification } = useNotification();

  return (
    <div>
      <div data-testid="notification-count">
        {notifications.length} notifications
      </div>
      <button
        onClick={() => addNotification('Test notification', 'success')}
        data-testid="add-notification-btn"
      >
        Add Notification
      </button>
      <button
        onClick={() => notifications[0] && removeNotification(notifications[0].id)}
        data-testid="remove-notification-btn"
      >
        Remove Notification
      </button>
    </div>
  );
};

// Combined test wrapper
const AllContextsProvider = ({ children }) => (
  <NotificationProvider>
    <AppProvider>
      <AuthProvider>
        <ITRProvider>
          {children}
        </ITRProvider>
      </AuthProvider>
    </AppProvider>
  </NotificationProvider>
);

describe('Context Management Integration Tests', () => {
  test('AuthContext should manage authentication state', async () => {
    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');

    fireEvent.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated as');
    });

    fireEvent.click(screen.getByTestId('logout-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });
  });

  test('ITRContext should manage filing state', async () => {
    render(
      <ITRProvider>
        <TestITRComponent />
      </ITRProvider>
    );

    expect(screen.getByTestId('filing-count')).toHaveTextContent('0 filings');
    expect(screen.getByTestId('current-filing')).toHaveTextContent('No current filing');

    fireEvent.click(screen.getByTestId('create-filing-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('filing-count')).toHaveTextContent('1 filings');
      expect(screen.getByTestId('current-filing')).toHaveTextContent('Current: ITR-1');
    });
  });

  test('AppContext should manage app settings', async () => {
    render(
      <AppProvider>
        <TestAppComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('Theme: light');
    expect(screen.getByTestId('language')).toHaveTextContent('Language: en');

    fireEvent.click(screen.getByTestId('toggle-theme-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('Theme: dark');
    });

    fireEvent.click(screen.getByTestId('update-language-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('language')).toHaveTextContent('Language: hi');
    });
  });

  test('NotificationContext should manage notifications', async () => {
    render(
      <NotificationProvider>
        <TestNotificationComponent />
      </NotificationProvider>
    );

    expect(screen.getByTestId('notification-count')).toHaveTextContent('0 notifications');

    fireEvent.click(screen.getByTestId('add-notification-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('notification-count')).toHaveTextContent('1 notifications');
    });

    fireEvent.click(screen.getByTestId('remove-notification-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('notification-count')).toHaveTextContent('0 notifications');
    });
  });

  test('All contexts should work together without conflicts', async () => {
    render(
      <AllContextsProvider>
        <div>
          <TestAuthComponent />
          <TestITRComponent />
          <TestAppComponent />
          <TestNotificationComponent />
        </div>
      </AllContextsProvider>
    );

    // Initial state
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    expect(screen.getByTestId('filing-count')).toHaveTextContent('0 filings');
    expect(screen.getByTestId('theme')).toHaveTextContent('Theme: light');
    expect(screen.getByTestId('notification-count')).toHaveTextContent('0 notifications');

    // Interact with all contexts
    fireEvent.click(screen.getByTestId('login-btn'));
    fireEvent.click(screen.getByTestId('create-filing-btn'));
    fireEvent.click(screen.getByTestId('toggle-theme-btn'));
    fireEvent.click(screen.getByTestId('add-notification-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated as');
      expect(screen.getByTestId('filing-count')).toHaveTextContent('1 filings');
      expect(screen.getByTestId('theme')).toHaveTextContent('Theme: dark');
      expect(screen.getByTestId('notification-count')).toHaveTextContent('1 notifications');
    });
  });

  test('Context hooks should throw errors when used outside providers', () => {
    const expectHookError = (Hook) => {
      expect(() => {
        render(<Hook />);
      }).toThrow('must be used within a');
    };

    expectHookError(() => {
      const TestComponent = () => {
        useAuth();
        return <div>Test</div>;
      };
      return <TestComponent />;
    });

    expectHookError(() => {
      const TestComponent = () => {
        useITR();
        return <div>Test</div>;
      };
      return <TestComponent />;
    });

    expectHookError(() => {
      const TestComponent = () => {
        useApp();
        return <div>Test</div>;
      };
      return <TestComponent />;
    });

    expectHookError(() => {
      const TestComponent = () => {
        useNotification();
        return <div>Test</div>;
      };
      return <TestComponent />;
    });
  });
});