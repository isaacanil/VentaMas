import React from 'react';
import type { ReactNode } from 'react';
import { Spin } from 'antd';

import {
  IconWrapper,
  Label,
  PillBadge,
  StyledPillButton,
} from './PillButton.styles';

export type PillButtonProps = Omit<React.ComponentProps<'button'>, 'color'> & {
  icon?: ReactNode;
  loading?: boolean;
  bg?: string;
  color?: string;
  badgeCount?: number;
};

export const PillButton = ({
  icon,
  children,
  loading = false,
  bg,
  color,
  disabled = false,
  badgeCount,
  type,
  ...buttonProps
}: PillButtonProps) => {
  const showBadge = typeof badgeCount === 'number' && badgeCount > 0;

  return (
    <StyledPillButton
      type={type ?? 'button'}
      $bg={bg}
      $color={color}
      disabled={disabled || loading}
      {...buttonProps}
    >
      {icon && <IconWrapper>{icon}</IconWrapper>}
      <Label>{children}</Label>
      {showBadge && <PillBadge count={badgeCount} overflowCount={9999} />}
      {loading && <Spin size="small" />}
    </StyledPillButton>
  );
};
