import styled from 'styled-components';

const LoaderContainer = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 9999;

  opacity: ${p => (p.$open ? 1 : 0)};
  transition: opacity 300ms ease-out;

  /* Importante: cuando está cerrando/oculto, no debe interceptar clicks */
  pointer-events: ${p => (p.$open ? 'auto' : 'none')};
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  color: white;
  margin-top: 20px;
  font-size: 16px;
  font-weight: 500;
`;

const ErrorContainer = styled.div`
  max-width: 500px;
  padding: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const ErrorTitle = styled.h2`
  color: #e53e3e;
  margin-bottom: 16px;
  font-size: 24px;
`;

const ErrorMessage = styled.p`
  color: #4a5568;
  margin-bottom: 20px;
  line-height: 1.6;
`;

const RetryButton = styled.button`
  background: #667eea;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #5568d3;
  }
`;

export const SessionManager = ({ status, error }) => {
  const open = status === 'checking' || status === 'error';

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <LoaderContainer $open={open} aria-hidden={!open} >
      {status === 'error' ? (
        <ErrorContainer>
          <ErrorTitle>Error de Sesión</ErrorTitle>
          <ErrorMessage>
            {error?.message ||
              'Ha ocurrido un error al iniciar sesión. Por favor, intenta nuevamente.'}
          </ErrorMessage>
          <RetryButton onClick={handleRetry}>Reintentar</RetryButton>
        </ErrorContainer>
      ) : (
        <>
          <Spinner />
          <LoadingText>Cargando sesión...</LoadingText>
        </>
      )}
    </LoaderContainer>
  );
};
