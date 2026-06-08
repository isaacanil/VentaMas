import styled from 'styled-components';

import { VmListBox } from '@/components/heroui';

type PanelVariant = 'standalone' | 'embedded';

export const Panel = styled.section<{ $variant?: PanelVariant }>`
  display: grid;
  gap: var(--ds-space-3);
  min-width: 0;
  padding: ${({ $variant }) =>
    $variant === 'embedded' ? 0 : 'var(--ds-space-4)'};
  border: ${({ $variant }) =>
    $variant === 'embedded' ? 0 : '1px solid var(--ds-color-border-subtle)'};
  border-radius: ${({ $variant }) => ($variant === 'embedded' ? 0 : '8px')};
  background: ${({ $variant }) =>
    $variant === 'embedded' ? 'transparent' : 'var(--ds-color-bg-surface)'};
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
  grid-template-columns: minmax(0, 1fr);
  gap: var(--ds-space-3);
  align-items: end;
  min-width: 0;

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

export const FrequencyListBox = styled(VmListBox)`
  min-width: min(240px, calc(100vw - var(--ds-space-6)));
`;

export const FrequencyHelp = styled.span`
  overflow: hidden;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
`;
