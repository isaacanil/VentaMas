import styled, { css } from 'styled-components';

import { VmAlert, VmDateField, VmTable } from '@/components/heroui';
import { PageShell } from '@/components/layout/PageShell';

export const HrPage = styled(PageShell)`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  padding: var(--ds-space-5);
  overflow: auto;
  background: var(--ds-color-bg-page);
`;

export const HrPageHeader = styled.header`
  display: flex;
  gap: var(--ds-space-4);
  align-items: flex-start;
  justify-content: space-between;

  @media (max-width: 860px) {
    flex-direction: column;
  }
`;

export const HrTitleBlock = styled.div`
  display: grid;
  gap: var(--ds-space-1);
`;

export const HrTitle = styled.h1`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-xl);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
`;

export const HrDescription = styled.p`
  max-width: 760px;
  margin: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
`;

export const HrSummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(140px, 1fr));
  gap: var(--ds-space-3);

  @media (max-width: 920px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

export const HrSummaryItem = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  min-width: 0;
  padding: var(--ds-space-3);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: 8px;
  background: var(--ds-color-bg-surface);
`;

export const HrSummaryLabel = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
`;

export const HrSummaryValue = styled.strong`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-lg);
  line-height: var(--ds-line-height-tight);
`;

export const HrTableFrame = styled(VmTable)`
  width: 100%;
  min-width: 0;
  overflow: hidden;

  [data-clickable='true'] {
    transition:
      background-color 0.16s ease,
      box-shadow 0.16s ease;
  }

  [data-clickable='true']:hover {
    background: var(--ds-color-bg-subtle);
  }

  [data-clickable='true']:focus-visible {
    outline: 3px solid var(--ds-color-border-focus);
    outline-offset: -3px;
  }

  [data-clickable='true'][data-selected='true'] {
    box-shadow: inset 3px 0 0 var(--ds-color-action-primary);
  }
`;

export const HrTableTitle = styled.div`
  padding: var(--ds-space-3) var(--ds-space-4);
  border-bottom: 1px solid var(--ds-color-border-subtle);
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
`;

export const HrTableState = styled.div`
  display: inline-flex;
  gap: var(--ds-space-2);
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 112px;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;

export const HrTableFooter = styled.footer`
  display: flex;
  gap: var(--ds-space-3);
  align-items: center;
  justify-content: space-between;
  padding: var(--ds-space-3) var(--ds-space-4);
  border-top: 1px solid var(--ds-color-border-subtle);

  @media (max-width: 560px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const HrTableMeta = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
`;

export const HrPaginationActions = styled.div`
  display: inline-flex;
  gap: var(--ds-space-2);
  align-items: center;
  justify-content: flex-end;
`;

export const HrCellStack = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const HrPrimaryText = styled.span`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
`;

export const HrMutedText = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
`;

export const HrAmountText = styled.span`
  display: block;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  text-align: right;
`;

export const HrInlineStack = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--ds-space-1);
  align-items: center;
`;

export const HrActionGroup = styled.div`
  display: inline-flex;
  gap: var(--ds-space-2);
  align-items: center;
  justify-content: flex-end;
`;

export type HrTone =
  | 'default'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'accent';

const tagToneStyles = {
  default: css`
    color: var(--ds-color-text-secondary);
    background: var(--ds-color-bg-subtle);
    border-color: var(--ds-color-border-default);
  `,
  info: css`
    color: #1d4ed8;
    background: #eff6ff;
    border-color: #bfdbfe;
  `,
  success: css`
    color: #047857;
    background: #ecfdf5;
    border-color: #a7f3d0;
  `,
  warning: css`
    color: #b45309;
    background: #fffbeb;
    border-color: #fde68a;
  `,
  danger: css`
    color: #b91c1c;
    background: #fef2f2;
    border-color: #fecaca;
  `,
  accent: css`
    color: #6d28d9;
    background: #f5f3ff;
    border-color: #ddd6fe;
  `,
} satisfies Record<HrTone, ReturnType<typeof css>>;

export const HrStatusTag = styled.span<{ $tone?: HrTone }>`
  display: inline-flex;
  gap: var(--ds-space-1);
  align-items: center;
  width: max-content;
  min-height: 24px;
  padding: 2px var(--ds-space-2);
  border: 1px solid;
  border-radius: var(--ds-radius-full);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);

  ${({ $tone = 'default' }) => tagToneStyles[$tone]}
`;

export const HrNotice = styled(VmAlert)`
  width: 100%;
`;

export const DateRangeGroup = styled(VmDateField.Group)`
  display: flex;
  min-width: 260px;
`;

export const DateInputContainer = styled(VmDateField.InputContainer)`
  flex: 1;
`;
