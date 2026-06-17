import { Tooltip } from 'antd';
import React from 'react';

import { IconButton } from './ActionIcon.styles';

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
