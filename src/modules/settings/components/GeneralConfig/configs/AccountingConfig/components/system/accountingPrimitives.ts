import { css } from 'styled-components';

export const accountingLayout = {
  compactControlSize: '32px',
  compactChipMinHeight: '32px',
  panelHeaderMinHeight: '52px',
  panelPaddingX: 'var(--ds-space-5)',
  rowMinHeight: '44px',
  treeIndentStep: 16,
} as const;

export const accountingPanelSurfaceStyles = css`
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--ds-color-border-default);
  background: var(--ds-color-bg-surface);
`;

export const accountingPanelHeaderStyles = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-4);
  min-height: ${accountingLayout.panelHeaderMinHeight};
  padding: 0 ${accountingLayout.panelPaddingX};
  border-bottom: 1px solid var(--ds-color-border-subtle);
  flex-shrink: 0;
`;

export const accountingHeaderCopyStyles = css`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  min-width: 0;
`;

export const accountingTitleStyles = css`
  margin: 0;
  font-size: var(--ds-font-size-md);
  line-height: var(--ds-line-height-tight);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

export const accountingDescriptionStyles = css`
  margin: 0;
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-text-secondary);
`;

export const accountingStatValueStyles = css`
  font-size: var(--ds-font-size-lg);
  line-height: var(--ds-line-height-tight);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

export const accountingStatLabelStyles = css`
  margin-top: var(--ds-space-1);
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-text-secondary);
`;

export const accountingCompactControlStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: ${accountingLayout.compactControlSize};
  min-height: ${accountingLayout.compactControlSize};
  padding: 0 var(--ds-space-2);
  border-radius: var(--ds-radius-md);
`;

export const accountingFocusRingStyles = css`
  &:focus-visible {
    outline: none;
    box-shadow:
      0 0 0 2px var(--ds-color-bg-surface),
      0 0 0 4px var(--ds-color-border-focus);
  }
`;

export const accountingEmptyStateStyles = css`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 260px;
  padding: var(--ds-space-6);
`;
