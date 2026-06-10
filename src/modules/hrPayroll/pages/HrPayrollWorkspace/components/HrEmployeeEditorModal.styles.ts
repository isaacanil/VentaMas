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

export const FormSections = styled.div`
  display: grid;
  gap: var(--ds-space-4);
  width: 100%;
`;

export const FieldSection = styled.fieldset`
  display: grid;
  gap: var(--ds-space-3);
  min-width: 0;
  min-inline-size: 0;
  margin: 0;
  padding: var(--ds-space-3);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: 8px;
  background: var(--ds-color-bg-subtle);
`;

export const FieldSectionTitle = styled.legend`
  padding: 0 var(--ds-space-1);
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
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
