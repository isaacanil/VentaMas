import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';

const LoaderWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: ${(props) => props.minHeight || '40px'};
`;

const LoadingOverlay = styled.div`
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
  opacity: ${(props) => (props.$fadeOut ? 0 : 1)};
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

const ContentWrapper = styled.div`
  display: grid;
  height: 100%;
  opacity: ${(props) => (props.$loading ? 0.6 : 1)};
  transition: opacity 0.3s ease-in-out;
`;

const Loader = ({ loading = false, children, minHeight, overlay = true }) => {
  const [showLoader, setShowLoader] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const loadingStartTime = useRef(null);
  useEffect(() => {
    let timer;
    if (loading) {
      setShowLoader(true);
      setFadeOut(false);
      loadingStartTime.current = Date.now();
    } else {
      const loadingEndTime = Date.now();
      const loadingDuration = loadingEndTime - loadingStartTime.current;
      // Limit maximum fade duration to prevent long blocking
      const fadeOutDuration = Math.max(200, Math.min(loadingDuration, 500)); // Reduced max from 1000 to 500

      setFadeOut(true);
      if (loadingDuration > 300) {
        // Reduced from 500 to 300
        // Use requestAnimationFrame for better performance
        requestAnimationFrame(() => {
          timer = setTimeout(() => {
            setShowLoader(false);
          }, fadeOutDuration);
        });
      } else {
        setShowLoader(false);
      }
    }
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <LoaderWrapper minHeight={minHeight}>
      {showLoader && overlay && (
        <LoadingOverlay $fadeOut={fadeOut}>
          <Spinner />
        </LoadingOverlay>
      )}
      <ContentWrapper $loading={loading}>{children}</ContentWrapper>
    </LoaderWrapper>
  );
};

export default Loader;
