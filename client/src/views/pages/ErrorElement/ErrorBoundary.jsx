import React, { Component } from 'react';
import { ErrorElement } from './ErrorElement';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    // Asegúrate de inicializar el estado con error y errorInfo
    this.state = { hasError: false, error: null, errorStackTrace: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
   
    const errorStackTrace = error.stack;
    errorInfo = errorInfo.componentStack;
    this.setState({ errorStackTrace, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorElement errorStackTrace={this.state.errorStackTrace} errorInfo={this.state.errorInfo} />;
    }

    return this.props.children;
  }
}
