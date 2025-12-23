import React from 'react';

import { getStatusConfig } from '@/config/statusActionConfig';

import { Badge } from './Badge';

interface StatusCellProps {
  status: string;
}

export function StatusBadge({ status }: StatusCellProps) {
  const config = getStatusConfig(status);
  return (
    <Badge
      color={config.color}
      bgColor={config.bgColor}
      icon={config.icon}
      text={config.text}
    />
  );
}
