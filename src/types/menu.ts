import type { ReactNode } from 'react';

export interface MenuTag {
  color: string;
  text: string;
}

export interface MenuConditionContext {
  billingMode?: string;
  businessType?: string | null;
  authorizationFlowEnabled?: boolean;
  [key: string]: unknown;
}

export interface MenuItem {
  key?: string;
  label?: string;
  title?: string;
  icon?: ReactNode;
  route?: string;
  group?: string;
  groupType?: string;
  action?: string;
  color?: string;
  tag?: MenuTag;
  hideInMenu?: boolean;
  requiresDevAccess?: boolean;
  submenuIconOpen?: ReactNode;
  submenuIconClose?: ReactNode;
  condition?: (context: MenuConditionContext) => boolean;
  submenu?: MenuItem[];
  preload?: () => void | Promise<unknown>;
  routeMeta?: unknown;
  [key: string]: unknown;
}
