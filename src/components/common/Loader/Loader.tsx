import React from 'react';
import styled from 'styled-components';

interface LoaderProps {
  loading?: boolean;
  children: React.ReactNode;
  minHeight?: string;
  overlay?: boolean;
}

const LoaderWrapper = styled.div<{ $minHeight?: string }>`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: ${({ $minHeight }) => $minHeight || '40px'};
`;

const LoadingOverlay = styled.div<{ $visible?: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: rgb(255 255 255 / 80%);
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.5s ease-in-out;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgb(0 0 0 / 10%);
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
`;

const ContentWrapper = styled.div<{ $loading?: boolean }>`
  display: grid;
  height: 100%;
  opacity: ${({ $loading }) => ($loading ? 0.6 : 1)};
  transition: opacity 0.3s ease-in-out;
`;

const Loader = ({
  loading = false,
  children,
  minHeight,
  overlay = true,
}: LoaderProps) => {
  return (
    <LoaderWrapper $minHeight={minHeight}>
      {overlay && (
        <LoadingOverlay
          $visible={loading}
          style={{ pointerEvents: loading ? 'auto' : 'none' }}
          aria-hidden={!loading}
        >
          <Spinner />
        </LoadingOverlay>
      )}
      <ContentWrapper $loading={loading}>{children}</ContentWrapper>
    </LoaderWrapper>
  );
};

export default Loader;
