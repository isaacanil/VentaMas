import styled from 'styled-components';

import { VmAccordion } from '@/components/heroui';

export const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-3);
  width: 100%;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

export const FormSections = styled(VmAccordion)`
  display: grid;
  gap: var(--ds-space-3);
  width: 100%;
`;

export const FieldSection = styled(VmAccordion.Item)`
  overflow: hidden;
  min-width: 0;
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: 8px;
  background: var(--ds-color-bg-subtle);
`;

export const FieldSectionHeading = styled(VmAccordion.Heading)`
  margin: 0;
`;

export const FieldSectionTrigger = styled(VmAccordion.Trigger)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-2);
  width: 100%;
  min-height: 44px;
  padding: var(--ds-space-3);
  border: 0;
  color: inherit;
  background: transparent;
  text-align: left;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--ds-color-focus, var(--ds-color-primary));
    outline-offset: -2px;
  }
`;

export const FieldSectionTitle = styled.span`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
`;

export const FieldSectionIndicator = styled(VmAccordion.Indicator)`
  flex: 0 0 auto;
  width: 1rem;
  height: 1rem;
  color: var(--ds-color-text-secondary);
  transition: transform 160ms ease;

  &[data-expanded] {
    transform: rotate(180deg);
  }
`;

export const FieldSectionPanel = styled(VmAccordion.Panel)``;

export const FieldSectionBody = styled(VmAccordion.Body)`
  padding: 0 var(--ds-space-3) var(--ds-space-3);
`;

export const FieldSectionFieldset = styled.fieldset`
  display: grid;
  gap: var(--ds-space-3);
  min-width: 0;
  min-inline-size: 0;
  margin: 0;
  padding: 0;
  border: 0;
`;

export const FieldSectionLegend = styled.legend`
  position: absolute;
  overflow: hidden;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  clip: rect(0 0 0 0);
  white-space: nowrap;
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
