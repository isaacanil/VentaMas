import { DateTime } from 'luxon';
import React from 'react';

import { AppIcon } from '@/components/ui/AppIcon';
import type { ConfigItem } from '@/components/ui/statusDisplay/statusDisplayConfig';
import { semantic } from '@/design-system/tokens/semantic';

import {
  BadgeContainer,
  BadgeText,
  DateIconContainer,
  DateText,
} from './BadgeDate.styles';
import { renderBadgeDateIcon } from './BadgeDate.utils';

export type BadgeDateConfig = ConfigItem;

export interface BadgeDateProps {
  dateTime?: DateTime | null;
  config?: BadgeDateConfig | null | undefined;
}

const defaultConfig: BadgeDateConfig = {
  bgColor: semantic.color.bg.subtle,
  color: semantic.color.text.secondary,
  icon: <AppIcon name="calendar" tone="muted" sizeToken="sm" />,
  text: 'Fecha',
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
  const iconContent = renderBadgeDateIcon(finalConfig.icon, finalConfig.color);

  if (!config) {
    return (
      <BadgeContainer $simple>
        <DateText $simple>{formattedDate}</DateText>
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
