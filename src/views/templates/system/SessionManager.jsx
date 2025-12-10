import { useEffect, useState } from 'react';
import styled from 'styled-components';

const LoaderContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 9999;
  opacity: ${props => props.$isExiting ? 0 : 1};
  transition: opacity 0.3s ease-out;
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
   const [isExiting, setIsExiting] = useState(false);
   const [hasShownLoader, setHasShownLoader] = useState(false);

   const shouldRender = status === 'checking' || status === 'error';

   useEffect(() => {
      if (shouldRender) {
         setHasShownLoader(true);
         setIsExiting(false);
      } else if (hasShownLoader) {
         // Start exit animation
         setIsExiting(true);
         // Remove from DOM after animation
         const timer = setTimeout(() => {
            setHasShownLoader(false);
         }, 300);
         return () => clearTimeout(timer);
      }
   }, [shouldRender, hasShownLoader]);

   // Don't render if we haven't shown the loader yet and shouldn't render
   if (!hasShownLoader && !shouldRender) {
      return null;
   }

   // Don't render if we've shown the loader and it's done exiting
   if (hasShownLoader && !shouldRender && !isExiting) {
      return null;
   }

   const handleRetry = () => {
      window.location.reload();
   };

   return (
      <LoaderContainer $isExiting={isExiting}>
         {status === 'error' ? (
            <ErrorContainer>
               <ErrorTitle>Error de Sesión</ErrorTitle>
               <ErrorMessage>
                  {error?.message || 'Ha ocurrido un error al iniciar sesión. Por favor, intenta nuevamente.'}
               </ErrorMessage>
               <RetryButton onClick={handleRetry}>
                  Reintentar
               </RetryButton>
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
