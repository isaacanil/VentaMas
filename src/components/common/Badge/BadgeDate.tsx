import { DateTime } from 'luxon';
import React, { cloneElement, isValidElement } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import styled from 'styled-components';

import { AppIcon } from '@/components/ui/AppIcon';
import type { ConfigItem } from '@/config/statusActionConfig';
import { semantic } from '@/design-system/tokens/semantic';

type BadgeDateConfig = ConfigItem;

interface BadgeDateProps {
  dateTime?: DateTime | null;
  config?: BadgeDateConfig | null | undefined;
}

const defaultConfig: BadgeDateConfig = {
  bgColor: semantic.color.bg.subtle,
  color: semantic.color.text.secondary,
  icon: <AppIcon name="calendar" tone="muted" sizeToken="sm" />,
  text: 'Fecha',
};

const BadgeContainer = styled.div<{ $bgColor?: string; $simple?: boolean }>`
  display: ${({ $simple }: { $simple?: boolean }) =>
    $simple ? 'flex' : 'inline-block'};
  align-items: ${({ $simple }: { $simple?: boolean }) =>
    $simple ? 'center' : 'initial'};
  justify-content: ${({ $simple }: { $simple?: boolean }) =>
    $simple ? 'center' : 'initial'};
  min-width: 115px;
  padding: ${({ $simple }: { $simple?: boolean }) =>
    $simple ? '8px 16px' : '1px 8px'};
  background-color: ${({
    $simple,
    $bgColor,
  }: {
    $simple?: boolean;
    $bgColor?: string;
  }) =>
    $simple
      ? 'var(--ds-color-bg-subtle)'
      : $bgColor || 'var(--ds-color-state-info-subtle)'};
  border-radius: var(--ds-radius-md);
`;

const DateIconContainer = styled.div<{ $simple?: boolean }>`
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: ${({ $simple }: { $simple?: boolean }) =>
    $simple ? 'center' : 'space-between'};
`;

const DateText = styled.span<{ $color: string; $simple?: boolean }>`
  font-size: var(--ds-font-size-base);
  color: ${({ $simple, $color }: { $simple?: boolean; $color: string }) =>
    $simple ? 'var(--ds-color-text-secondary)' : $color};
`;

const BadgeText = styled.div<{ $color: string }>`
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  color: ${({ $color }: { $color: string }) => $color};
`;

interface IconProps {
  style?: CSSProperties;
}

const renderIcon = (icon: ReactNode, color: string) => {
  if (isValidElement<IconProps>(icon)) {
    return cloneElement(icon, {
      style: { color } as CSSProperties,
    });
  }
  return icon;
};

export const BadgeDate = ({
  dateTime = DateTime.now(),
  config,
}: BadgeDateProps) => {
  const finalConfig = {
    bgColor: config?.bgColor || defaultConfig.bgColor,
    color: config?.color || defaultConfig.color,
    icon: config?.icon || defaultConfig.icon,
    text: config?.text || defaultConfig.text,
  };

  const formattedDate =
    (dateTime?.isValid ?? false)
      ? (dateTime as DateTime).toFormat('dd/MM/yyyy')
      : DateTime.now().toFormat('dd/MM/yyyy');
  const iconContent = renderIcon(finalConfig.icon, finalConfig.color);

  if (!config) {
    return (
      <BadgeContainer $simple>
        <DateText $simple $color="">
          {formattedDate}
        </DateText>
      </BadgeContainer>
    );
  }

  return (
    <BadgeContainer $bgColor={finalConfig.bgColor}>
      <DateIconContainer>
        <DateText $color={finalConfig.color}>{formattedDate}</DateText>
        {iconContent}
      </DateIconContainer>
      <BadgeText $color={finalConfig.color}>{finalConfig.text}</BadgeText>
    </BadgeContainer>
  );
};
