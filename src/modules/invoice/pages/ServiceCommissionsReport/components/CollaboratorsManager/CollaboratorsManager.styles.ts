import styled from 'styled-components';

import {
  VmButton,
  VmForm,
  VmInput,
  VmLabel,
  VmListBox,
  VmNumberField,
  VmSelect,
} from '@/components/heroui';
export const Panel = styled(VmForm)`
  display: grid;
  gap: var(--ds-space-4);
  width: 100%;
  min-width: 0;
  container-type: inline-size;
`;

export const Header = styled.div`
  display: grid;
  gap: var(--ds-space-1);
`;

export const Title = styled.h3`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
`;

export const Description = styled.p`
  margin: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
`;

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns:
    minmax(0, 0.85fr) minmax(0, 1.45fr) minmax(0, 1fr)
    minmax(0, 0.9fr);
  gap: var(--ds-space-3);
  align-items: start;
  min-width: 0;

  @container (max-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @container (max-width: 440px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const Field = styled.div`
  display: grid;
  gap: var(--ds-space-2);
  min-width: 0;
`;

export const NameField = styled(Field)`
  @container (max-width: 640px) and (min-width: 441px) {
    grid-column: 1 / -1;
  }
`;

export const FieldLabel = styled(VmLabel)`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-tight);
`;

export const TextInput = styled(VmInput)`
  width: 100%;
  min-width: 0;
  min-height: 38px;
`;

export const CommissionSelect = styled(VmSelect)`
  width: 100%;
  min-width: 0;
`;

export const SelectTrigger = styled(VmSelect.Trigger)`
  width: 100%;
  min-height: 38px;
`;

export const CommissionListBox = styled(VmListBox)`
  min-width: min(220px, calc(100vw - var(--ds-space-6)));
`;

export const RateField = styled(VmNumberField)`
  width: 100%;
  min-width: 0;
`;

export const RateGroup = styled(VmNumberField.Group)`
  min-height: 38px;
`;

export const RateInput = styled(VmNumberField.Input)`
  min-width: 0;
  padding-inline: var(--ds-space-3);
`;

export const RateUnit = styled.span`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  align-self: stretch;
  padding: 0 var(--ds-space-3);
  border-left: 1px solid var(--ds-color-border-default);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  background: var(--ds-color-bg-subtle);
`;

export const FormActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  justify-content: flex-end;

  @container (max-width: 440px) {
    flex-direction: column-reverse;
  }
`;

export const ActionButton = styled(VmButton)`
  min-width: 112px;

  @container (max-width: 440px) {
    width: 100%;
  }
`;
