import { Empty, Spin } from 'antd';
import React from 'react';
import styled from 'styled-components';
import type { TreeFooterPlacement, TreeNodeData, TreeNodeId } from '../types';

const Items = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  min-height: 0;
  padding-bottom: 12px;
  overflow: hidden auto;
`;

const ItemsContent = styled.div`
  display: grid;
  align-content: start;
  flex: 1;
  width: 100%;
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
  margin-top: auto;
  pointer-events: none;

  &::before {
    position: absolute;
    inset: -12px 0 auto;
    z-index: 0;
    height: 32px;
    pointer-events: none;
    content: '';
  }

  > * {
    pointer-events: auto;
    position: relative;
    z-index: 1;
  }
`;

type TreeContentProps = {
  children?: React.ReactNode;
  filteredData: TreeNodeData[];
  selectedId?: TreeNodeId | null;
  loading?: boolean;
  loadingText?: string;
  footerPlacement?: TreeFooterPlacement;
  footerContent?: React.ReactNode | null;
};

const TreeContent = ({
  children,
  filteredData,
  selectedId,
  loading = false,
  loadingText = 'Cargando...',
  footerPlacement,
  footerContent,
}: TreeContentProps) => {
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
        <ItemsContent>{children}</ItemsContent>
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
