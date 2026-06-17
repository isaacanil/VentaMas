import { getStatusConfig } from '@/components/ui/statusDisplay/statusDisplayConfig';

import { BadgeRoot, Label } from './StatusBadge.styles';
import type { StatusBadgeProps } from './StatusBadge.types';
import {
  getForegroundColor,
  renderIconNode,
  resolveTone,
} from './StatusBadge.utils';

export type {
  StatusBadgeProps,
  StatusBadgeSize,
  StatusBadgeTone,
  StatusBadgeVariant,
} from './StatusBadge.types';

export const StatusBadge = ({
  status,
  label,
  tone,
  variant = 'subtle',
  size = 'md',
  icon,
  className,
}: StatusBadgeProps) => {
  const config = status ? getStatusConfig(status) : null;
  const resolvedTone = resolveTone(status, tone);
  const foreground = getForegroundColor(resolvedTone, variant);
  const resolvedLabel = label ?? config?.text ?? status ?? 'Sin estado';
  const resolvedIcon = icon ?? config?.icon ?? undefined;

  return (
    <BadgeRoot
      className={className}
      $tone={resolvedTone}
      $variant={variant}
      $size={size}
    >
      {renderIconNode(resolvedIcon, foreground, size)}
      <Label>{resolvedLabel}</Label>
    </BadgeRoot>
  );
};
