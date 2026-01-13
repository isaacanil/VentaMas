import { Tooltip } from 'antd';
import React from 'react';
import styled from 'styled-components';

interface ActionIconProps {
  icon: React.ReactNode;
  onClick: () => void;
  tooltip: string;
  color?: string;
  hoverColor?: string;
}

export const ActionIcon = ({
  icon,
  onClick,
  tooltip,
  color = '#8c8c8c',
  hoverColor = '#1890ff',
}: ActionIconProps) => {
  return (
    <Tooltip title={tooltip}>
      <IconWrapper onClick={onClick} $color={color} $hoverColor={hoverColor}>
        {icon}
      </IconWrapper>
    </Tooltip>
  );
};

type IconWrapperStyleProps = { $color: string; $hoverColor: string };

const IconWrapper = styled.div<{ $color: string; $hoverColor: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  font-size: 20px;
  color: ${(props: IconWrapperStyleProps) => props.$color};
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.3s;

  &:hover {
    color: ${(props: IconWrapperStyleProps) => props.$hoverColor};
    background-color: #f5f5f5;
  }
`;
