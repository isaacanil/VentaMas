import type { MouseEventHandler, ReactNode } from 'react';

type ClickHandler = MouseEventHandler<HTMLElement>;

export interface ButtonIconMenuProps {
  icon?: ReactNode;
  onClick?: ClickHandler;
  tooltip?: string;
  tooltipDescription?: string;
  tooltipPlacement?: string;
  indicator?: boolean;
  indicatorCount?: number;
  [key: string]: unknown;
}

export interface ButtonGroupProps {
  children: ReactNode;
  position?: string;
}

export interface TooltipProps {
  description?: ReactNode;
  Children: ReactNode;
  placement?: string;
}
