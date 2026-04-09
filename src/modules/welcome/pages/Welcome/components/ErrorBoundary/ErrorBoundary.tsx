import { ReloadOutlined, HomeOutlined } from '@/constants/icons/antd';
import { Result, Button } from 'antd';
import { m } from 'framer-motion';
import React from 'react';
import styled from 'styled-components';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <StyledResult
            status="error"
            title="¡Ups! Algo salió mal"
            subTitle="Ha ocurrido un error inesperado. Por favor, intenta recargar la página o contacta al soporte técnico si el problema persiste."
            extra={[
              <Button
                key="reload"
                type="primary"
                icon={<ReloadOutlined />}
                onClick={this.handleReload}
                size="large"
              >
                Recargar Página
              </Button>,
              <Button
                key="home"
                icon={<HomeOutlined />}
                onClick={this.handleGoHome}
                size="large"
              >
                Ir al Inicio
              </Button>,
            ]}
          />
          {process.env.NODE_ENV === 'development' && (
            <ErrorDetails>
              <details style={{ whiteSpace: 'pre-wrap', marginTop: '20px' }}>
                <summary
                  style={{ cursor: 'pointer', color: '#666', fontSize: '14px' }}
                >
                  Ver detalles del error (Desarrollo)
                </summary>
                <ErrorText>
                  <strong>Error:</strong>{' '}
                  {this.state.error && this.state.error.toString()}
                </ErrorText>
                <ErrorText>
                  <strong>Stack Trace:</strong>{' '}
                  {this.state.errorInfo?.componentStack ?? ''}
                </ErrorText>
              </details>
            </ErrorDetails>
          )}
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

// Styled Components
const ErrorContainer = styled(m.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 20px;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
`;

const StyledResult = styled(Result)`
  width: 100%;
  max-width: 600px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgb(0 0 0 / 10%);

  .ant-result-title {
    font-weight: 600;
    color: #ff4d4f;
  }

  .ant-result-subtitle {
    font-size: 16px;
    line-height: 1.6;
    color: #666;
  }

  .ant-result-extra {
    margin-top: 24px;

    .ant-btn {
      margin: 0 8px;
      font-weight: 500;
      border-radius: 6px;

      &:hover {
        box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
        transform: translateY(-1px);
      }
    }
  }
`;

const ErrorDetails = styled.div`
  position: absolute;
  right: 20px;
  bottom: 20px;
  left: 20px;
  max-height: 200px;
  padding: 16px;
  overflow-y: auto;
  background: #f8f8f8;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
`;

const ErrorText = styled.div`
  margin: 8px 0;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #666;

  strong {
    color: #333;
  }
`;

export default ErrorBoundary;
