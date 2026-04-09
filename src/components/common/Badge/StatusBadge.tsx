import React from 'react';

import { StatusBadge as AppStatusBadge } from '@/components/ui/StatusBadge';

interface StatusCellProps {
  status: string;
}

export function StatusBadge({ status }: StatusCellProps) {
  return <AppStatusBadge status={status} />;
}
