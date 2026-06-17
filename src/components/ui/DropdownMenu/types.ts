import type { ReactNode } from 'react';

export interface DropdownMenuOption {
  id?: string | number;
  text?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  isActive?: boolean;
  disabled?: boolean;
  closeWhenAction?: boolean;
  action?: () => void;
  [key: string]: unknown;
}

export interface DropdownMenuProps {
  title?: string;
  options?: DropdownMenuOption[];
  customButton?: ReactNode;
  [key: string]: unknown;
}
