import { Empty, Spin } from 'antd';
import React from 'react';
import styled from 'styled-components';

const Items = styled.div`
  display: grid;
  flex: 1;
  align-content: start;
  width: 100%;
  min-height: 0;
  padding-bottom: 12px;
  overflow: hidden auto;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 0;

  .ant-spin-text {
    color: var(--color-text-secondary, #666);
  }
`;

const StickyFooter = styled.div`
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
  margin-top: 12px;
  pointer-events: none;

  &::before {
    position: absolute;
    inset: -12px 0 auto;
    z-index: 0;
    height: 32px;
    pointer-events: none;
    content: '';
    background: linear-gradient(
      to top,
      rgb(248 250 252 / 95%),
      rgb(248 250 252 / 0%)
    );
  }

  > * {
    pointer-events: auto;
    position: relative;
    z-index: 1;
  }
`;

const TreeContent = ({
  children,
  filteredData,
  selectedId,
  loading = false,
  loadingText = 'Cargando...',
  footerPlacement,
  footerContent,
}) => {
  if (loading) {
    return (
      <LoadingContainer>
        <Spin tip={loadingText}>
          <div style={{ width: '100%', minHeight: 160 }} />
        </Spin>
      </LoadingContainer>
    );
  }

  if (filteredData.length > 0) {
    return (
      <Items>
        {children}
        {footerPlacement === 'sticky' && footerContent ? (
          <StickyFooter>{footerContent}</StickyFooter>
        ) : null}
      </Items>
    );
  }

  return selectedId ? (
    <Empty description="Sin selección" />
  ) : (
    <Empty description="No se encontraron elementos" />
  );
};

export default TreeContent;
