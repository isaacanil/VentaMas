import styled from 'styled-components';

import {
  VmLabel,
  VmListBox,
  VmNumberField,
  VmSelect,
} from '@/components/heroui';

export const Section = styled.div`
  grid-column: 1 / -1;
  display: grid;
  gap: var(--ds-space-3);
  min-width: 0;
  padding: var(--ds-space-3);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: 8px;
  background: var(--ds-color-bg-subtle);
`;

export const SectionHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  align-items: center;
  justify-content: space-between;
  min-width: 0;
`;

export const SectionTitle = styled(VmLabel)`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
`;

export const EmptyState = styled.div`
  min-height: 38px;
  padding: var(--ds-space-3);
  border: 1px dashed var(--ds-color-border-default);
  border-radius: var(--ds-radius-sm);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;

export const RuleList = styled.div`
  display: grid;
  gap: var(--ds-space-2);
  min-width: 0;
`;

export const RuleRow = styled.div`
  display: grid;
  grid-template-columns:
    minmax(180px, 1fr) minmax(128px, 0.5fr) minmax(112px, 0.4fr)
    36px;
  gap: var(--ds-space-2);
  align-items: end;
  min-width: 0;

  @media (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const RuleField = styled.label`
  display: grid;
  gap: var(--ds-space-1);
  min-width: 0;
`;

export const RuleLabel = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
`;

export const ServiceSelect = styled(VmSelect)`
  width: 100%;
  min-width: 0;
`;

export const TypeSelect = styled(VmSelect)`
  width: 100%;
  min-width: 0;
`;

export const ServiceListBox = styled(VmListBox)`
  min-width: min(280px, calc(100vw - var(--ds-space-6)));
`;

export const TypeListBox = styled(VmListBox)`
  min-width: 180px;
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
  padding: 0 var(--ds-space-2);
  border-left: 1px solid var(--ds-color-border-default);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  background: var(--ds-color-bg-page);
`;

export const RemoveButtonSlot = styled.div`
  display: flex;
  align-items: end;
  justify-content: end;
  min-height: 38px;
`;
