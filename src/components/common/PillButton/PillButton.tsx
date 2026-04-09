import React from 'react';
import type { ReactNode } from 'react';
import { Badge, Spin } from 'antd';
import styled, { css } from 'styled-components';

interface PillButtonStyleProps {
  $bg?: string;
  $color?: string;
}

type PillButtonProps = Omit<React.ComponentProps<'button'>, 'color'> & {
  icon?: ReactNode;
  loading?: boolean;
  bg?: string;
  color?: string;
  badgeCount?: number;
};

const base = css`
  display: inline-flex;
  gap: 0.6em;
  align-items: center;
  justify-content: space-between;
  width: auto;
  padding: 0.4em 0.6em;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid #e2e1e1;
  border-radius: 50px;
  transition: all 0.25s ease;

  &:active {
    box-shadow: 0 1px 4px rgb(0 0 0 / 15%);
    transform: translateY(1px);
  }

  &:disabled {
    cursor: not-allowed;
    box-shadow: none;
    opacity: 0.7;
  }
`;

const StyledPillButton = styled.button<PillButtonStyleProps>`
  ${base}

  background-color: ${({ $bg }) => $bg || 'white'};
  color: ${({ $color }) => $color || 'black'};
`;

const IconWrapper = styled.span`
  display: flex;
  align-items: center;
`;

const Label = styled.span`
  font-weight: 500;
`;

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
}: PillButtonProps) => (
  <StyledPillButton
    type={type ?? 'button'}
    $bg={bg}
    $color={color}
    disabled={disabled || loading}
    {...buttonProps}
  >
    {icon && <IconWrapper>{icon}</IconWrapper>}
    <Label>{children}</Label>
    <Badge
      count={badgeCount}
      overflowCount={9999}
      style={{
        zIndex: 10,
      }}
    ></Badge>
    {loading && <Spin size="small" />}
  </StyledPillButton>
);
