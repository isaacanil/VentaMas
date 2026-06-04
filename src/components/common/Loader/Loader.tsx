import React from 'react';

import {
  ContentWrapper,
  LoaderWrapper,
  LoadingOverlay,
  Spinner,
} from './Loader.styles';

export interface LoaderProps {
  loading?: boolean;
  children: React.ReactNode;
  minHeight?: string;
  overlay?: boolean;
}

const Loader = ({
  loading = false,
  children,
  minHeight,
  overlay = true,
}: LoaderProps) => {
  return (
    <LoaderWrapper $minHeight={minHeight}>
      {overlay && (
        <LoadingOverlay $visible={loading} aria-hidden={!loading}>
          <Spinner />
        </LoadingOverlay>
      )}
      <ContentWrapper $loading={loading}>{children}</ContentWrapper>
    </LoaderWrapper>
  );
};

export default Loader;
