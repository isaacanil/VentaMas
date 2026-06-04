import styled from 'styled-components';

import { VmNumberField } from '@/components/heroui';

export const Panel = styled.section`
  display: grid;
  gap: var(--ds-space-3);
  min-width: 0;
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: 8px;
  background: var(--ds-color-bg-surface);
`;

export const PanelHeader = styled.header`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  align-items: center;
  justify-content: space-between;
  min-width: 0;
`;

export const PanelTitle = styled.h2`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
`;

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns:
    minmax(180px, 1fr) minmax(112px, 132px) minmax(112px, 132px)
    minmax(96px, max-content) max-content;
  gap: var(--ds-space-3);
  align-items: end;
  min-width: 0;

  @media (max-width: 920px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

export const Field = styled.label`
  display: grid;
  gap: var(--ds-space-1);
  min-width: 0;
`;

export const FieldLabel = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
`;

export const DayField = styled(VmNumberField)`
  width: 100%;
  min-width: 0;
`;

export const DayGroup = styled(VmNumberField.Group)`
  min-height: 38px;
`;

export const DayInput = styled(VmNumberField.Input)`
  min-width: 0;
  padding-inline: var(--ds-space-3);
`;

export const SwitchField = styled.label`
  display: flex;
  gap: var(--ds-space-2);
  align-items: center;
  min-height: 38px;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
`;

export const FormActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  align-items: center;
  justify-content: flex-end;
  min-height: 38px;
`;

export const RuleList = styled.div`
  display: grid;
  gap: var(--ds-space-2);
  min-width: 0;
`;

export const RuleRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: var(--ds-space-3);
  align-items: center;
  min-width: 0;
  padding: var(--ds-space-3);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: 8px;
  background: var(--ds-color-bg-page);

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    align-items: start;
  }
`;

export const RuleMeta = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  min-width: 0;
`;

export const RuleName = styled.strong`
  overflow: hidden;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const RuleDetail = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
`;

export const StatusPill = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 var(--ds-space-2);
  border-radius: 999px;
  color: ${({ $active }) =>
    $active
      ? 'var(--ds-color-state-success-text)'
      : 'var(--ds-color-text-secondary)'};
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  background: ${({ $active }) =>
    $active
      ? 'var(--ds-color-state-success-subtle)'
      : 'var(--ds-color-bg-subtle)'};
`;

export const RuleActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  justify-content: flex-end;
`;

export const EmptyState = styled.div`
  min-height: 72px;
  display: grid;
  place-items: center;
  padding: var(--ds-space-4);
  border: 1px dashed var(--ds-color-border-default);
  border-radius: 8px;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;

