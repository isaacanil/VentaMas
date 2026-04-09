import React, { Component } from 'react';

import { ErrorElement } from './ErrorElement';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorStackTrace: string | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    // Asegúrate de inicializar el estado con error y errorInfo
    this.state = {
      hasError: false,
      error: null,
      errorStackTrace: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorStackTrace = error.stack;
    const componentStack = errorInfo.componentStack;
    this.setState({ error, errorStackTrace, errorInfo: componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorElement
          errorStackTrace={this.state.errorStackTrace}
          errorInfo={this.state.errorInfo}
        />
      );
    }

    return this.props.children;
  }
}
