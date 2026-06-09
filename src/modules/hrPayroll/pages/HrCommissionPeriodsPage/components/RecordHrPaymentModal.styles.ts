import styled from 'styled-components';

export const PaymentSummary = styled.div`
  display: grid;
  gap: var(--ds-space-3);
  margin-bottom: var(--ds-space-3);
`;

export const PaymentSummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-2);

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

export const PaymentSummaryItem = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
  padding: var(--ds-space-2);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: 8px;
  background: var(--ds-color-bg-subtle);
`;

export const PaymentSummaryLabel = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
`;

export const PaymentSummaryValue = styled.strong`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
`;

export const PaymentWarning = styled.p`
  margin: 0;
  padding: var(--ds-space-2);
  color: #92400e;
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-normal);
  border: 1px solid #fde68a;
  border-radius: 8px;
  background: #fffbeb;
`;

export const FieldHint = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-normal);
`;

export const FormError = styled.div`
  padding: var(--ds-space-2);
  color: #991b1b;
  font-size: var(--ds-font-size-sm);
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fef2f2;
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

export const ModalActions = styled.div`
  display: flex;
  gap: var(--ds-space-2);
  justify-content: flex-end;
`;
