import styled from 'styled-components';

export const PaymentSummary = styled.div`
  margin-bottom: var(--ds-space-3);
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
