import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by AgriGrade ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FCFBF5] p-6 text-center">
          <div className="max-w-md w-full bg-white border border-[#C5E6CC] rounded-2xl p-8 shadow-sm">
            <div className="w-16 h-16 bg-[#EEF8F0] text-[#2E7D32] rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-[#1B5E20] mb-2">Something went wrong</h2>
            <p className="text-sm text-[#526158] mb-6">
              Unable to complete request. Please try again or return to dashboard.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => this.setState({ hasError: false })}
                className="flex-1 px-4 py-2.5 bg-white border border-[#C5E6CC] text-[#1B5E20] font-medium rounded-xl hover:bg-[#F4FAF4] transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2.5 bg-[#2E7D32] text-white font-medium rounded-xl hover:bg-[#1B5E20] transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Home className="w-4 h-4" /> Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
