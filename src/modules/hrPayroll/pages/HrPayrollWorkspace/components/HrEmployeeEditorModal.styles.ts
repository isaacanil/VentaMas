import styled from 'styled-components';

export const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-3);
  width: 100%;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

export const Field = styled.label`
  display: grid;
  gap: var(--ds-space-1);
  min-width: 0;
`;

export const FullWidthField = styled(Field)`
  grid-column: 1 / -1;
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
