import styled from 'styled-components';

import { VmListBox, VmSelect } from '@/components/heroui';

export const PickerField = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  min-width: 0;
`;

export const PickerLabel = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
`;

export const CutRuleSelect = styled(VmSelect)`
  width: 100%;
  min-width: 0;
`;

export const CutRuleListBox = styled(VmListBox)`
  min-width: min(320px, calc(100vw - var(--ds-space-6)));
`;

export const PendingCutPreview = styled.span`
  overflow: hidden;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const PendingCutOption = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const PendingCutOptionTitle = styled.span`
  overflow: hidden;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const PendingCutOptionMeta = styled.span`
  overflow: hidden;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
`;
