import { Empty, Spin } from 'antd';
import React from 'react';
import styled from 'styled-components';

const Items = styled.div`
  display: grid;
  overflow-x: hidden;
  overflow-y: auto;
  align-content: start;
  width: 100%;
  flex: 1;
  min-height: 0;
  padding-bottom: 12px;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
  width: 100%;
  gap: 8px;

  .ant-spin-text {
    color: var(--color-text-secondary, #666);
  }
`;

const StickyFooter = styled.div`
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
  padding-top: 8px;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }

  &::before {
    content: '';
    position: absolute;
    inset: -12px 0 auto;
    height: 32px;
    background: linear-gradient(
      to top,
      rgba(248, 250, 252, 0.95),
      rgba(248, 250, 252, 0)
    );
    z-index: 0;
    pointer-events: none;
  }

  > * {
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
        <Spin tip={loadingText} />
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
