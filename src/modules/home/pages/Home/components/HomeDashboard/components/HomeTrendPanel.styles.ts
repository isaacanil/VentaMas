import { Link } from 'react-router-dom';
import styled from 'styled-components';

export const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-5);
  min-width: 0;
  padding: var(--ds-space-5);
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-sm);
`;

export const PanelHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ds-space-3);
`;

export const Eyebrow = styled.span`
  display: block;
  margin-bottom: var(--ds-space-1);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-bold);
  color: var(--ds-color-text-muted);
  text-transform: uppercase;
`;

export const PanelTitle = styled.h2`
  margin: 0;
  font-size: var(--ds-font-size-lg);
  line-height: var(--ds-line-height-tight);
  color: var(--ds-color-text-primary);
`;

export const RangeLabel = styled.span`
  flex: 0 0 auto;
  padding: 0.2rem 0.55rem;
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-action-primary);
  background: var(--ds-color-action-primary-subtle);
  border-radius: var(--ds-radius-pill);
`;

export const TrendBars = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: var(--ds-space-3);
  align-items: end;
  height: 140px;
  padding: var(--ds-space-4);
  background: var(--ds-color-bg-subtle);
  border-radius: var(--ds-radius-md);
`;

export const TrendItem = styled.div`
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: var(--ds-space-2);
  height: 100%;
  min-width: 0;
`;

export const TrendBarTrack = styled.div`
  display: flex;
  align-items: end;
  justify-content: center;
  min-height: 0;
  background: var(--ds-color-bg-surface);
  border-radius: var(--ds-radius-sm);
`;

export const TrendBar = styled.div`
  width: 100%;
  min-height: 8px;
  background: var(--ds-color-action-primary);
  border-radius: var(--ds-radius-sm);
`;

export const TrendLabel = styled.span`
  overflow: hidden;
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-muted);
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ProductsBlock = styled.div`
  display: grid;
  gap: var(--ds-space-3);
`;

export const BlockTitle = styled.h3`
  margin: 0;
  font-size: var(--ds-font-size-md);
  color: var(--ds-color-text-primary);
`;

export const ProductList = styled.div`
  display: grid;
  gap: var(--ds-space-2);
`;

export const ProductRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--ds-space-3);
  align-items: center;
  padding: var(--ds-space-3) 0;
  border-bottom: 1px solid var(--ds-color-border-subtle);

  &:last-child {
    border-bottom: 0;
  }

  @media (width <= 560px) {
    grid-template-columns: 1fr;
  }
`;

export const ProductName = styled.strong`
  overflow: hidden;
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ProductMeta = styled.span`
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-secondary);
  white-space: nowrap;
`;

export const EmptyState = styled.div`
  display: grid;
  gap: var(--ds-space-2);
  place-items: center;
  min-height: 140px;
  padding: var(--ds-space-5);
  text-align: center;
  background: var(--ds-color-bg-subtle);
  border-radius: var(--ds-radius-md);
`;

export const EmptyTitle = styled.strong`
  font-size: var(--ds-font-size-md);
  color: var(--ds-color-text-primary);
`;

export const EmptyText = styled.span`
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-muted);
`;

export const EmptyAction = styled(Link)`
  margin-top: var(--ds-space-1);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-action-primary);
  text-decoration: none;
`;
