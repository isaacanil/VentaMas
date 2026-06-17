import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import type { ReactNode } from 'react';

export interface SimplePanelHeaderProps {
  icon?: IconProp;
  title?: ReactNode;
  badgeCount?: number;
  metaItems?: Array<{
    hint?: ReactNode;
    label: string;
    value: number | string;
  }>;
  showMeta?: boolean;
}

export interface FiscalReceiptsPanelProps {
  data?: unknown;
}
