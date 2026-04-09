import { Tooltip } from 'antd';
import React from 'react';
import styled from 'styled-components';

type ActionIconProps = Omit<React.ComponentProps<'button'>, 'color'> & {
  icon: React.ReactNode;
  tooltip: string;
  color?: string;
  hoverColor?: string;
};

export const ActionIcon = ({
  icon,
  tooltip,
  color = '#8c8c8c',
  hoverColor = '#1890ff',
  type,
  ...buttonProps
}: ActionIconProps) => {
  return (
    <Tooltip title={tooltip}>
      <IconButton
        type={type ?? 'button'}
        $color={color}
        $hoverColor={hoverColor}
        {...buttonProps}
      >
        {icon}
      </IconButton>
    </Tooltip>
  );
};

type IconButtonStyleProps = { $color: string; $hoverColor: string };

const IconButton = styled.button<IconButtonStyleProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  font-size: 20px;
  color: ${(props: IconButtonStyleProps) => props.$color};
  cursor: pointer;
  background: none;
  border: none;
  border-radius: 6px;
  transition: all 0.3s;

  &:hover {
    color: ${(props: IconButtonStyleProps) => props.$hoverColor};
    background-color: #f5f5f5;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;
