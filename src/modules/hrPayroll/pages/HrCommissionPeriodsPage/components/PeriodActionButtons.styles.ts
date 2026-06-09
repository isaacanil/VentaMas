import styled, { css } from 'styled-components';

type ActionStatusTone = 'default' | 'success' | 'accent';

const actionStatusToneStyles = {
  default: css`
    color: var(--ds-color-text-secondary);
    background: var(--ds-color-bg-subtle);
    border-color: var(--ds-color-border-default);
  `,
  success: css`
    color: #047857;
    background: #ecfdf5;
    border-color: #a7f3d0;
  `,
  accent: css`
    color: #6d28d9;
    background: #f5f3ff;
    border-color: #ddd6fe;
  `,
} satisfies Record<ActionStatusTone, ReturnType<typeof css>>;

export const PeriodActionGroup = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  align-items: center;
  justify-content: flex-end;

  &[data-layout='toolbar'] {
    min-width: 0;
  }

  @media (width <= 640px) {
    &[data-layout='toolbar'] {
      width: 100%;
      justify-content: stretch;
    }

    &[data-layout='toolbar'] > * {
      flex: 1 1 160px;
    }
  }
`;

export const PeriodActionStatus = styled.span<{ $tone?: ActionStatusTone }>`
  display: inline-flex;
  gap: var(--ds-space-1);
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 var(--ds-space-3);
  border: 1px solid;
  border-radius: var(--ds-radius-full);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  white-space: nowrap;

  ${({ $tone = 'default' }) => actionStatusToneStyles[$tone]}
`;
