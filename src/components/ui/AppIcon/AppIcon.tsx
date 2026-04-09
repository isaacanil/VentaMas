import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
import type { CSSProperties } from 'react';

import { iconGlyphs } from '@/constants/icons/registry';

export type AppIconName = keyof typeof iconGlyphs;
export type AppIconTone =
  | 'default'
  | 'muted'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'inverse';

type AppIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeMap: Record<AppIconSize, string> = {
  xs: 'var(--ds-font-size-xs)',
  sm: 'var(--ds-font-size-sm)',
  md: 'var(--ds-font-size-base)',
  lg: 'var(--ds-font-size-lg)',
  xl: 'var(--ds-font-size-xl)',
};

const toneMap: Record<AppIconTone, string> = {
  default: 'var(--ds-color-text-primary)',
  muted: 'var(--ds-color-text-muted)',
  primary: 'var(--ds-color-action-primary)',
  success: 'var(--ds-color-state-success-text)',
  warning: 'var(--ds-color-state-warning-text)',
  danger: 'var(--ds-color-state-danger-text)',
  info: 'var(--ds-color-state-info-text)',
  inverse: 'var(--ds-color-text-inverse)',
};

export interface AppIconProps
  extends Omit<FontAwesomeIconProps, 'icon' | 'color'> {
  name?: AppIconName;
  icon?: IconDefinition;
  tone?: AppIconTone;
  sizeToken?: AppIconSize;
  color?: string;
}

export const AppIcon = ({
  name,
  icon,
  tone = 'default',
  sizeToken = 'md',
  style,
  color,
  ...props
}: AppIconProps) => {
  const resolvedIcon = icon ?? (name ? iconGlyphs[name] : undefined);

  if (!resolvedIcon) {
    return null;
  }

  const mergedStyle: CSSProperties = {
    color: color ?? toneMap[tone],
    fontSize: sizeMap[sizeToken],
    ...style,
  };

  return <FontAwesomeIcon icon={resolvedIcon} style={mergedStyle} {...props} />;
};
