import { css } from 'styled-components';

/**
 * Scrollbar mixins for styled-components.
 *
 * Policy: use the native browser scrollbar everywhere.
 * The only mixin provided is `hidden` for cases where
 * the scrollbar must be invisible (e.g. horizontal navs).
 *
 * Usage:
 *   import { scrollbarStyles } from '@/design-system';
 *
 *   const HorizontalNav = styled.nav`
 *     overflow-x: auto;
 *     ${scrollbarStyles.hidden}
 *   `;
 */

/** Hidden scrollbar — still scrollable, no visible bar */
export const hidden = css`
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const scrollbarStyles = {
  hidden,
} as const;
