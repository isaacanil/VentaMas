import React from 'react';

import {
  ContentWrapper,
  LoaderWrapper,
  LoadingOverlay,
  Spinner,
} from './ManagementLoader.styles';

export interface ManagementLoaderProps {
  loading?: boolean;
  children: React.ReactNode;
  minHeight?: string;
  overlay?: boolean;
}

const ManagementLoader = ({
  loading = false,
  children,
  minHeight,
  overlay = true,
}: ManagementLoaderProps) => {
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

export default ManagementLoader;
