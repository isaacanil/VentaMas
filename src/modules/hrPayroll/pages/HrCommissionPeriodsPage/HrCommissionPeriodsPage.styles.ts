import styled from 'styled-components';
import { Link } from 'react-router-dom';

import { VmTabs } from '@/components/heroui';

export const PeriodsToolbar = styled.div`
  display: grid;
  grid-template-columns: max-content;
  gap: var(--ds-space-3);
  align-items: end;
  justify-content: start;

  @media (width <= 640px) {
    grid-template-columns: 1fr;
  }
`;

export const NextCutPanel = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr) max-content;
  gap: var(--ds-space-3);
  align-items: center;
  padding: var(--ds-space-3) var(--ds-space-4);
  border: 1px solid var(--ds-color-border-subtle);
  border-left: 3px solid var(--ds-color-action-primary);
  border-radius: 8px;
  background: var(--ds-color-bg-surface);
  box-shadow: var(--ds-shadow-xs, 0 1px 2px rgb(15 23 42 / 6%));

  &[data-blocked='true'] {
    border-left-color: var(--ds-color-state-warning);
  }

  @media (width <= 760px) {
    grid-template-columns: 1fr;
  }
`;

export const NextCutStack = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  min-width: 0;
`;

export const NextCutActions = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  align-items: center;
  justify-content: flex-end;
  margin-inline-start: auto;

  @media (width <= 760px) {
    justify-content: flex-start;
    margin-inline-start: 0;
  }
`;

export const NextCutInlineMeta = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  align-items: center;
  min-width: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
`;

export const NextCutAmountBadge = styled.strong`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 2px var(--ds-space-2);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-pill, 999px);
  background: var(--ds-color-action-primary-subtle);
  color: var(--ds-color-action-primary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
`;

export const NextCutMessage = styled.p`
  margin: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
`;

export const SummaryHint = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
`;

export const OperationalPanel = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(240px, 0.8fr);
  gap: var(--ds-space-4);
  align-items: center;
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: 8px;
  background: var(--ds-color-bg-surface);

  @media (width <= 860px) {
    grid-template-columns: 1fr;
  }
`;

export const OperationalStack = styled.div`
  display: grid;
  gap: var(--ds-space-2);
  min-width: 0;
`;

export const OperationalEyebrow = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
`;

export const OperationalTitle = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  align-items: center;
  min-width: 0;
`;

export const OperationalName = styled.strong`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-lg);
  line-height: var(--ds-line-height-tight);
`;

export const OperationalDescription = styled.p`
  max-width: 720px;
  margin: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
`;

export const WorkflowSteps = styled.ol`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--ds-space-2);
  min-width: 0;
  padding: 0;
  margin: 0;
  list-style: none;

  @media (width <= 560px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const WorkflowStep = styled.li`
  display: grid;
  gap: 2px;
  min-width: 0;
  padding: var(--ds-space-2);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: 8px;
  background: var(--ds-color-bg-subtle);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);

  &[data-active='true'] {
    border-color: var(--ds-color-border-focus);
    background: var(--ds-color-action-primary-subtle);
    color: var(--ds-color-text-primary);
    font-weight: var(--ds-font-weight-semibold);
  }

  &[data-complete='true'] {
    color: #047857;
    background: #ecfdf5;
  }
`;

export const PeriodsContent = styled.div`
  display: grid;
  gap: var(--ds-space-4);
  min-width: 0;
  content-visibility: auto;
  contain-intrinsic-size: auto 520px;

  @supports not (content-visibility: auto) {
    contain: layout style paint;
  }
`;

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

export const DetailLinkButton = styled(Link)`
  display: inline-flex;
  gap: var(--ds-space-1);
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 var(--ds-space-3);
  color: var(--ds-color-action-primary);
  text-decoration: none;
  white-space: nowrap;
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-full);
  background: var(--ds-color-bg-subtle);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;

  &:hover {
    border-color: var(--ds-color-border-focus);
    background: var(--ds-color-action-primary-subtle);
  }

  &:focus-visible {
    outline: 3px solid var(--ds-color-border-focus);
    outline-offset: 2px;
  }
`;

export const DetailScreenActions = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  align-items: center;
  justify-content: flex-end;
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
