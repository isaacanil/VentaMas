import styled from 'styled-components';

import {
  VmLabel,
  VmListBox,
  VmNumberField,
  VmSelect,
} from '@/components/heroui';

export const Content = styled.div`
  display: grid;
  gap: var(--ds-space-4);
  min-width: 0;
`;

export const HeaderBlock = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  min-width: 0;
`;

export const ServiceName = styled.h3`
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
  white-space: nowrap;
`;

export const StatusLine = styled.div`
  display: inline-flex;
  gap: var(--ds-space-2);
  align-items: center;
  min-width: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;

export const FieldsGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(112px, 0.6fr);
  gap: var(--ds-space-3);

  @media (width <= 520px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const Field = styled.div<{ $wide?: boolean }>`
  display: grid;
  grid-column: ${({ $wide }) => ($wide ? '1 / -1' : 'auto')};
  gap: var(--ds-space-2);
  min-width: 0;
`;

export const FieldLabel = styled(VmLabel)`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
`;

export const CollaboratorSelect = styled(VmSelect)`
  width: 100%;
  min-width: 0;
`;

export const TypeSelect = styled(VmSelect)`
  width: 100%;
  min-width: 0;
`;

export const CollaboratorListBox = styled(VmListBox)`
  min-width: min(280px, calc(100vw - var(--ds-space-6)));
`;

export const TypeListBox = styled(VmListBox)`
  min-width: 180px;
`;

export const LoadingItem = styled(VmListBox.Item)`
  display: flex;
  gap: var(--ds-space-2);
  align-items: center;
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

export const Summary = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-2);

  @media (width <= 520px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const SummaryItem = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  padding: var(--ds-space-3);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-sm);
  background: var(--ds-color-bg-subtle);

  span {
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-xs);
  }

  strong {
    color: var(--ds-color-text-primary);
    font-size: var(--ds-font-size-sm);
    font-variant-numeric: tabular-nums;
  }
`;
