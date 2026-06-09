import styled from 'styled-components';

export const ReversalSummary = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  padding: var(--ds-space-3);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-subtle);
`;

export const SummaryTitle = styled.strong`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
`;

export const SummaryText = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  line-height: 1.5;
`;

export const Field = styled.label`
  display: grid;
  gap: var(--ds-space-2);
`;

export const FieldLabel = styled.span`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
`;

export const FieldHint = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  line-height: 1.45;
`;

export const ModalActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  justify-content: flex-end;

  @media (width <= 520px) {
    > * {
      flex: 1 1 140px;
    }
  }
`;
