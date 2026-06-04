import styled from 'styled-components';

export const AdjustmentSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--ds-space-2);
  margin-bottom: var(--ds-space-3);

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

export const SummaryMetric = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
  padding: var(--ds-space-2);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: 8px;
  background: var(--ds-color-bg-subtle);
`;

export const SummaryLabel = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
`;

export const SummaryValue = styled.strong`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-tight);
`;

export const FieldGrid = styled.div`
  display: grid;
  gap: var(--ds-space-3);
`;

export const Field = styled.label`
  display: grid;
  gap: var(--ds-space-1);
`;

export const FieldLabel = styled.span`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
`;

export const FieldHint = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
`;

export const ModalActions = styled.div`
  display: flex;
  gap: var(--ds-space-2);
  justify-content: flex-end;
`;
