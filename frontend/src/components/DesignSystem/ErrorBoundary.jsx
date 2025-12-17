// =====================================================
// ERROR BOUNDARY COMPONENT
// Enhanced error boundary with better UX and recovery options
// =====================================================

import React from 'react';
import { AlertTriangle, RefreshCw, Home, Mail, XCircle } from 'lucide-react';
import { Button } from './components';
import { enterpriseLogger } from '../../utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error, errorInfo) {
    enterpriseLogger.error('ErrorBoundary caught an error', {
      error: error.toString(),
      errorInfo,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
    });

    this.setState({
      errorInfo,
    });

    // Optionally send to error tracking service
    if (this.props.onError) {
      this.props.onError(error, errorInfo, this.state.errorId);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorId } = this.state;
      const { fallback, showDetails = false } = this.props;

      // Custom fallback UI
      if (fallback) {
        return fallback(error, errorInfo, this.handleReset);
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white shadow-elevation-3 rounded-xl p-6">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-error-100 rounded-full mb-4">
              <AlertTriangle className="w-8 h-8 text-error-600" />
            </div>

            <div className="text-center mb-6">
              <h3 className="text-heading-4 font-semibold text-slate-900 mb-2">
                Something went wrong
              </h3>
              <p className="text-body-regular text-slate-600 mb-4">
                We're sorry, but something unexpected happened. Our team has been notified.
              </p>
              {errorId && (
                <p className="text-body-small text-slate-500 mb-4">
                  Error ID: <code className="bg-slate-100 px-2 py-1 rounded">{errorId}</code>
                </p>
              )}
            </div>

            {showDetails && error && (
              <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                <details className="text-body-regular">
                  <summary className="cursor-pointer text-slate-700 font-medium mb-2">
                    Error Details
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong className="text-slate-700">Error:</strong>
                      <pre className="mt-1 text-body-small text-error-600 overflow-auto">
                        {error.toString()}
                      </pre>
                    </div>
                    {errorInfo && errorInfo.componentStack && (
                      <div>
                        <strong className="text-slate-700">Component Stack:</strong>
                        <pre className="mt-1 text-body-small text-slate-600 overflow-auto max-h-32">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button
                variant="primary"
                onClick={this.handleReset}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>

              <Button
                variant="secondary"
                onClick={this.handleReload}
                className="w-full"
              >
                Reload Page
              </Button>

              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>

              {this.props.showContactSupport && (
                <a
                  href="mailto:support@burnblack.com?subject=Error Report"
                  className="flex items-center justify-center gap-2 text-body-regular text-slate-600 hover:text-slate-900"
                >
                  <Mail className="w-4 h-4" />
                  Contact Support
                </a>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

