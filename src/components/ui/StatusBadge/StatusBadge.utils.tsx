import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  cloneElement,
  isValidElement,
  type CSSProperties,
  type ReactNode,
} from 'react';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';

import { statusToneMap, toneTokens } from './StatusBadge.tokens';
import type {
  StatusBadgeSize,
  StatusBadgeTone,
  StatusBadgeVariant,
} from './StatusBadge.types';

export const resolveTone = (
  status?: string,
  tone?: StatusBadgeTone,
): StatusBadgeTone =>
  tone ?? (status ? (statusToneMap[status] ?? 'neutral') : 'neutral');

export const getForegroundColor = (
  tone: StatusBadgeTone,
  variant: StatusBadgeVariant,
) => {
  const tokens = toneTokens[tone];

  return variant === 'solid' ? tokens.solidText : tokens.subtleText;
};

export const renderIconNode = (
  icon: ReactNode | AppIconName | IconDefinition | undefined,
  color: string,
  size: StatusBadgeSize,
) => {
  if (!icon) return null;

  if (typeof icon === 'string') {
    return (
      <AppIcon
        name={icon}
        color={color}
        sizeToken={size === 'sm' ? 'xs' : 'sm'}
      />
    );
  }

  if (isValidElement<{ style?: CSSProperties }>(icon)) {
    return cloneElement(icon, {
      style: {
        color,
        ...icon.props.style,
      },
    });
  }

  if (
    typeof icon === 'object' &&
    icon !== null &&
    'iconName' in icon &&
    'prefix' in icon
  ) {
    return (
      <AppIcon
        icon={icon as IconDefinition}
        color={color}
        sizeToken={size === 'sm' ? 'xs' : 'sm'}
      />
    );
  }

  return null;
};
