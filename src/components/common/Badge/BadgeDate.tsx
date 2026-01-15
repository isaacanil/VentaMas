import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DateTime } from 'luxon';
import React, { cloneElement, isValidElement } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import styled from 'styled-components';

import type { ConfigItem } from '@/config/statusActionConfig';

type BadgeDateConfig = ConfigItem;

interface BadgeDateProps {
  dateTime?: DateTime | null;
  config?: BadgeDateConfig | null | undefined;
}

const defaultConfig: BadgeDateConfig = {
  bgColor: '#f5f5f5',
  color: '#666666',
  icon: <FontAwesomeIcon icon={faCalendar} />,
  text: 'Fecha',
};

const BadgeContainer = styled.div<{ $bgColor?: string; $simple?: boolean }>`
  display: ${({ $simple }: { $simple?: boolean }) => ($simple ? 'flex' : 'inline-block')};
  align-items: ${({ $simple }: { $simple?: boolean }) => ($simple ? 'center' : 'initial')};
  justify-content: ${({ $simple }: { $simple?: boolean }) => ($simple ? 'center' : 'initial')};
  min-width: 115px;
  padding: ${({ $simple }: { $simple?: boolean }) => ($simple ? '8px 16px' : '1px 8px')};
  background-color: ${({ $simple, $bgColor }: { $simple?: boolean; $bgColor?: string }) =>
    $simple ? '#f8f9fa' : $bgColor || '#E3F2FD'};
  border-radius: 6px;
`;

const DateIconContainer = styled.div<{ $simple?: boolean }>`
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: ${({ $simple }: { $simple?: boolean }) => ($simple ? 'center' : 'space-between')};
`;

const DateText = styled.span<{ $color: string; $simple?: boolean }>`
  font-size: 14px;
  color: ${({ $simple, $color }: { $simple?: boolean; $color: string }) => ($simple ? '#495057' : $color)};
`;

const BadgeText = styled.div<{ $color: string }>`
  font-size: 12px;
  font-weight: 500;
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

  const formattedDate = (dateTime?.isValid ?? false)
    ? (dateTime as DateTime).toFormat('dd/MM/yyyy')
    : DateTime.now().toFormat('dd/MM/yyyy');

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
        {renderIcon(finalConfig.icon, finalConfig.color)}
      </DateIconContainer>
      <BadgeText $color={finalConfig.color}>{finalConfig.text}</BadgeText>
    </BadgeContainer>
  );
};
