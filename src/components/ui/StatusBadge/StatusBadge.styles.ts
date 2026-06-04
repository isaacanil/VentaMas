import styled, { css } from 'styled-components';

import { toneTokens } from './StatusBadge.tokens';
import type {
  StatusBadgeSize,
  StatusBadgeTone,
  StatusBadgeVariant,
} from './StatusBadge.types';

const sizeStyles = {
  sm: css`
    gap: var(--ds-space-2);
    min-height: 20px;
    padding: 0 var(--ds-space-2);
    font-size: var(--ds-font-size-xs);
  `,
  md: css`
    gap: var(--ds-space-2);
    min-height: 24px;
    padding: 0 var(--ds-space-3);
    font-size: var(--ds-font-size-sm);
  `,
} as const;

interface BadgeRootProps {
  $tone: StatusBadgeTone;
  $variant: StatusBadgeVariant;
  $size: StatusBadgeSize;
}

export const BadgeRoot = styled.span<BadgeRootProps>`
  display: inline-flex;
  align-items: center;
  border: 1px solid transparent;
  border-radius: var(--ds-radius-pill);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-tight);
  white-space: nowrap;

  ${({ $size }) => sizeStyles[$size]}

  ${({ $tone, $variant }) => {
    const tokens = toneTokens[$tone];

    switch ($variant) {
      case 'solid':
        return css`
          background: ${tokens.solidBg};
          color: ${tokens.solidText};
        `;
      case 'outline':
        return css`
          background: transparent;
          border-color: ${tokens.subtleText};
          color: ${tokens.subtleText};
        `;
      default:
        return css`
          background: ${tokens.subtleBg};
          color: ${tokens.subtleText};
        `;
    }
  }}
`;

export const Label = styled.span`
  display: inline-flex;
  align-items: center;
`;
