import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { ReactNode } from 'react';

import type { AppIconName } from '@/components/ui/AppIcon';

export type StatusBadgeTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type StatusBadgeVariant = 'subtle' | 'solid' | 'outline';
export type StatusBadgeSize = 'sm' | 'md';

export interface ToneTokens {
  subtleBg: string;
  subtleText: string;
  solidBg: string;
  solidText: string;
}

export interface StatusBadgeProps {
  status?: string;
  label?: ReactNode;
  tone?: StatusBadgeTone;
  variant?: StatusBadgeVariant;
  size?: StatusBadgeSize;
  icon?: ReactNode | AppIconName | IconDefinition;
  className?: string;
}
