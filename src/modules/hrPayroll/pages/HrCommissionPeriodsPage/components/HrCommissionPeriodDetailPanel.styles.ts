import styled from 'styled-components';

import { VmTabs } from '@/components/heroui';

export const DetailSection = styled.section`
  display: grid;
  gap: var(--ds-space-3);
  min-width: 0;
  content-visibility: auto;
  contain-intrinsic-size: auto 360px;

  @supports not (content-visibility: auto) {
    contain: layout style paint;
  }
`;

export const DetailHeader = styled.header`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-3);
  align-items: flex-start;
  justify-content: space-between;
  min-width: 0;
`;

export const DetailHeadingStack = styled.div`
  display: grid;
  flex: 1 1 280px;
  gap: var(--ds-space-1);
  min-width: 0;
`;

export const DetailTitle = styled.h2`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
`;

export const DetailDescription = styled.p`
  margin: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
`;

export const DetailTabs = styled(VmTabs)`
  display: grid;
  gap: var(--ds-space-3);
  min-width: 0;

  > [data-slot='tabs-list-container'] {
    justify-self: start;
    max-width: 100%;
    overflow-x: auto;
  }

  > [data-slot='tabs-list-container'] > [data-slot='tabs-list'] {
    width: fit-content;
    max-width: 100%;
  }

  > [data-slot='tabs-list-container'] [data-slot='tabs-tab'] {
    width: auto;
    white-space: nowrap;
  }
`;

export const DetailPanelContent = styled.div`
  min-width: 0;
`;

export const DetailEmptyState = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  min-height: 140px;
  place-content: center;
  padding: var(--ds-space-5);
  border: 1px dashed var(--ds-color-border-default);
  border-radius: 8px;
  background: var(--ds-color-bg-surface);
  text-align: center;
`;

export const DetailEmptyTitle = styled.strong`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
`;

export const DetailEmptyText = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;
