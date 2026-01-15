import type { ReactNode, RefObject } from 'react';

export interface ButtonIconMenuProps {
  icon?: any;
  onClick?: any;
  tooltip?: string;
  tooltipDescription?: string;
  tooltipPlacement?: string;
  indicator?: boolean;
  indicatorCount?: number;
  [key: string]: any;
}

export interface OpenMenuButtonProps {
  onClick?: any;
  zIndex?: number;
  isOpen?: boolean;
}

export interface NotificationButtonProps {
  handleCloseMenu?: any;
  className?: string;
  [key: string]: any;
}

export interface ButtonGroupProps {
  children: ReactNode;
  position?: string;
}

export interface TooltipProps {
  description?: any;
  Children: ReactNode;
  placement?: any;
}

export interface CenteredTextProps {
  textVariant?: string;
  containerVariant?: string;
  text?: ReactNode;
  buttonText?: ReactNode;
  handleAction?: any;
  showAfter?: number;
  [key: string]: any;
}

export interface DropdownMenuProps {
  title?: string;
  options?: DropdownMenuOption[];
  customButton?: ReactNode;
  [key: string]: any;
}

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

export interface FormattedValueProps {
  type?: any;
  value?: any;
  size?: any;
  bold?: boolean;
  noWrap?: boolean;
  color?: any;
  transformValue?: boolean;
  align?: any;
}

export interface TypographyProps {
  variant?: string;
  context?: string;
  color?: string;
  align?: string;
  display?: string;
  gutterBottom?: boolean;
  disableMargins?: boolean;
  noWrap?: boolean;
  component?: any;
  className?: string;
  size?: string;
  italic?: boolean;
  strikethrough?: boolean;
  textShadow?: any;
  children?: ReactNode;
  bold?: boolean;
  underline?: boolean;
  uppercase?: boolean;
  capitalize?: boolean;
  lowercase?: boolean;
  letterSpacing?: string;
  textTransform?: string;
  [key: string]: any;
}

export interface LoaderProps {
  useRedux?: boolean;
  show?: any;
  message?: any;
  theme?: string;
}

export interface SimplePanelHeaderProps {
  icon?: any;
  title?: any;
  badgeCount?: number;
  metaItems?: any[];
  showMeta?: boolean;
}

export interface FiscalReceiptsPanelProps {
  data?: any;
}

export interface InventoryFilterAndSortProps {
  tooltip?: any;
  tooltipDescription?: any;
  tooltipPlacement?: any;
  contextKey?: string;
}

export interface PresetsSectionProps {
  presets?: any[];
  value?: any;
  mode?: any;
  isMobile?: boolean;
  onPresetClick?: (preset: any) => void;
  showPresetsDropdown?: boolean;
  setShowPresetsDropdown?: (value: boolean) => void;
  presetsDropdownRef?: RefObject<any>;
  layout?: string;
}
