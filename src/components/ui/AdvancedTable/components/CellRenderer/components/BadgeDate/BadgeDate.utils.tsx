import { cloneElement, isValidElement } from 'react';
import type { CSSProperties, ReactNode } from 'react';

interface IconProps {
  style?: CSSProperties;
}

export const renderBadgeDateIcon = (icon: ReactNode, color: string) => {
  if (isValidElement<IconProps>(icon)) {
    return cloneElement(icon, {
      style: { color } as CSSProperties,
    });
  }

  return icon;
};
