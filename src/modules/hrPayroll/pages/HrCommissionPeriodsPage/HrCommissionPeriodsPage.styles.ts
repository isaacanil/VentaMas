import styled from 'styled-components';

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
    border-color: #f59e0b;
    border-left-color: var(--ds-color-state-warning);
    background: #fffbeb;
  }

  &[data-loading='true'] {
    border-left-color: var(--ds-color-border-focus);
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

export const DetailScreenActions = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  align-items: center;
  justify-content: flex-end;
`;

export const ExportMenuItemContent = styled.span`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const ExportMenuItemTitle = styled.span`
  display: inline-flex;
  gap: var(--ds-space-2);
  align-items: center;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
`;

export const ExportMenuItemDescription = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-normal);
`;
