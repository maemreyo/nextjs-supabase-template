'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { clientLogger } from '@/services/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class AnalysisErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    clientLogger.error('AnalysisErrorBoundary', { type: 'error_caught', error: error.message, stack: error.stack });
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    clientLogger.error('AnalysisErrorBoundary', {
      type: 'component_did_catch',
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    clientLogger.info('AnalysisErrorBoundary', { type: 'error_boundary_reset' });
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Alert className="mb-6 border-destructive/50 bg-destructive/10 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Đã xảy ra lỗi trong trang Analysis</p>
                <p className="text-sm">
                  {this.state.error?.message || 'Lỗi không xác định đã xảy ra'}
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-2 text-xs">
                    <summary>Chi tiết lỗi (Development)</summary>
                    <pre className="mt-2 p-2 bg-background rounded border overflow-auto max-h-40">
                      {this.state.error?.stack}
                    </pre>
                    {this.state.errorInfo && (
                      <pre className="mt-2 p-2 bg-background rounded border overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </details>
                )}
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={this.handleReset}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Thử lại
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.reload()}
                  >
                    Tải lại trang
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AnalysisErrorBoundary;