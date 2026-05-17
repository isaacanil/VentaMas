import { css } from 'styled-components';

export const vmControlFocusRing = '0 0 0 3px rgb(22 119 255 / 24%)';

export const vmControlBorderStyles = css`
  border: 1px solid var(--ds-color-border-default);
  box-shadow: none;

  &[data-hovered='true'],
  &:hover {
    border-color: var(--ds-color-border-strong);
  }

  &[data-focused='true'],
  &[data-focus-visible='true'],
  &[data-focus-within='true'],
  &:focus-visible {
    border-color: var(--ds-color-border-focus);
    outline: none;
    box-shadow: ${vmControlFocusRing};
  }

  &[data-disabled='true'],
  &[aria-disabled='true'],
  &:disabled {
    border-color: var(--ds-color-interactive-disabled-border);
  }
`;

export const vmSurfaceBorderStyles = css`
  border: 1px solid var(--ds-color-border-default);
  box-shadow: none !important;
  filter: none !important;
`;
