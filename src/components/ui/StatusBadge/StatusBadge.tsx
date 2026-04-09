import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { cloneElement, isValidElement, type CSSProperties, type ReactNode } from 'react';
import styled, { css } from 'styled-components';

import { getStatusConfig } from '@/config/statusActionConfig';
import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';

export type StatusBadgeTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type StatusBadgeVariant = 'subtle' | 'solid' | 'outline';
export type StatusBadgeSize = 'sm' | 'md';

interface ToneTokens {
  subtleBg: string;
  subtleText: string;
  solidBg: string;
  solidText: string;
}

const toneTokens: Record<StatusBadgeTone, ToneTokens> = {
  neutral: {
    subtleBg: 'var(--ds-color-bg-subtle)',
    subtleText: 'var(--ds-color-text-secondary)',
    solidBg: 'var(--ds-color-text-secondary)',
    solidText: 'var(--ds-color-text-inverse)',
  },
  success: {
    subtleBg: 'var(--ds-color-state-success-subtle)',
    subtleText: 'var(--ds-color-state-success-text)',
    solidBg: 'var(--ds-color-state-success)',
    solidText: 'var(--ds-color-state-on-success)',
  },
  warning: {
    subtleBg: 'var(--ds-color-state-warning-subtle)',
    subtleText: 'var(--ds-color-state-warning-text)',
    solidBg: 'var(--ds-color-state-warning)',
    solidText: 'var(--ds-color-state-on-warning)',
  },
  danger: {
    subtleBg: 'var(--ds-color-state-danger-subtle)',
    subtleText: 'var(--ds-color-state-danger-text)',
    solidBg: 'var(--ds-color-state-danger)',
    solidText: 'var(--ds-color-state-on-danger)',
  },
  info: {
    subtleBg: 'var(--ds-color-state-info-subtle)',
    subtleText: 'var(--ds-color-state-info-text)',
    solidBg: 'var(--ds-color-state-info)',
    solidText: 'var(--ds-color-state-on-info)',
  },
};

const statusToneMap: Record<string, StatusBadgeTone> = {
  completed: 'success',
  pending: 'warning',
  canceled: 'danger',
  processing: 'info',
  overdue: 'danger',
  today: 'info',
  warning: 'warning',
  upcoming: 'success',
  onTime: 'success',
  invalid: 'neutral',
  default: 'neutral',
};

const sizeStyles = {
  sm: css`
    gap: var(--ds-space-2);
    min-height: 20px;
    padding: 0 var(--ds-space-2);
    font-size: var(--ds-font-size-xs);
  `,
  md: css`
    gap: var(--ds-space-2);
    min-height: 24px;
    padding: 0 var(--ds-space-3);
    font-size: var(--ds-font-size-sm);
  `,
} as const;

const resolveTone = (status?: string, tone?: StatusBadgeTone): StatusBadgeTone =>
  tone ?? (status ? statusToneMap[status] ?? 'neutral' : 'neutral');

const renderIconNode = (
  icon: ReactNode | AppIconName | IconDefinition | undefined,
  color: string,
  size: StatusBadgeSize,
) => {
  if (!icon) return null;

  if (typeof icon === 'string') {
    return <AppIcon name={icon} color={color} sizeToken={size === 'sm' ? 'xs' : 'sm'} />;
  }

  if (isValidElement<{ style?: CSSProperties }>(icon)) {
    return cloneElement(icon, {
      style: {
        color,
        ...(icon.props.style ?? {}),
      },
    });
  }

  return <AppIcon icon={icon} color={color} sizeToken={size === 'sm' ? 'xs' : 'sm'} />;
};

export interface StatusBadgeProps {
  status?: string;
  label?: ReactNode;
  tone?: StatusBadgeTone;
  variant?: StatusBadgeVariant;
  size?: StatusBadgeSize;
  icon?: ReactNode | AppIconName | IconDefinition;
  className?: string;
}

interface BadgeRootProps {
  $tone: StatusBadgeTone;
  $variant: StatusBadgeVariant;
  $size: StatusBadgeSize;
}

const BadgeRoot = styled.span<BadgeRootProps>`
  display: inline-flex;
  align-items: center;
  border-radius: var(--ds-radius-pill);
  border: 1px solid transparent;
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-tight);
  white-space: nowrap;

  ${({ $size }) => sizeStyles[$size]}

  ${({ $tone, $variant }) => {
    const tokens = toneTokens[$tone];

    switch ($variant) {
      case 'solid':
        return css`
          background: ${tokens.solidBg};
          color: ${tokens.solidText};
        `;
      case 'outline':
        return css`
          background: transparent;
          color: ${tokens.subtleText};
          border-color: ${tokens.subtleText};
        `;
      default:
        return css`
          background: ${tokens.subtleBg};
          color: ${tokens.subtleText};
        `;
    }
  }}
`;

const Label = styled.span`
  display: inline-flex;
  align-items: center;
`;

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
  const tokens = toneTokens[resolvedTone];
  const foreground =
    variant === 'solid' ? tokens.solidText : tokens.subtleText;
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
