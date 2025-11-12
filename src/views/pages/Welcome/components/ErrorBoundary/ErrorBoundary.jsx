import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';
import { Result, Button } from 'antd';
import { motion } from 'framer-motion';
import React from 'react';
import styled from 'styled-components';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
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
          as={motion.div}
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
              </Button>
            ]}
          />
          {process.env.NODE_ENV === 'development' && (
            <ErrorDetails>
              <details style={{ whiteSpace: 'pre-wrap', marginTop: '20px' }}>
                <summary style={{ cursor: 'pointer', color: '#666', fontSize: '14px' }}>
                  Ver detalles del error (Desarrollo)
                </summary>
                <ErrorText>
                  <strong>Error:</strong> {this.state.error && this.state.error.toString()}
                </ErrorText>
                <ErrorText>
                  <strong>Stack Trace:</strong> {this.state.errorInfo.componentStack}
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
const ErrorContainer = styled.div`
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  padding: 20px;
`;

const StyledResult = styled(Result)`
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 40px;
  max-width: 600px;
  width: 100%;
  
  .ant-result-title {
    color: #ff4d4f;
    font-weight: 600;
  }
  
  .ant-result-subtitle {
    color: #666;
    font-size: 16px;
    line-height: 1.6;
  }
  
  .ant-result-extra {
    margin-top: 24px;
    
    .ant-btn {
      margin: 0 8px;
      border-radius: 6px;
      font-weight: 500;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    }
  }
`;

const ErrorDetails = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  background: #f8f8f8;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e8e8e8;
  max-height: 200px;
  overflow-y: auto;
`;

const ErrorText = styled.div`
  margin: 8px 0;
  font-size: 12px;
  color: #666;
  font-family: 'Courier New', monospace;
  
  strong {
    color: #333;
  }
`;

export default ErrorBoundary;
