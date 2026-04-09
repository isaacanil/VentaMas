import type {
  ElementType,
  MouseEventHandler,
  ReactNode,
  RefObject,
} from 'react';

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

export interface OpenMenuButtonProps {
  onClick?: ClickHandler;
  zIndex?: number;
  isOpen?: boolean;
}

export interface NotificationButtonProps {
  handleCloseMenu?: () => void;
  className?: string;
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

export interface CenteredTextProps {
  textVariant?: string;
  containerVariant?: string;
  text?: ReactNode;
  buttonText?: ReactNode;
  handleAction?: ClickHandler;
  showAfter?: number;
  [key: string]: unknown;
}

export interface DropdownMenuProps {
  title?: string;
  options?: DropdownMenuOption[];
  customButton?: ReactNode;
  [key: string]: unknown;
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
  type?: string;
  value?: string | number | null | undefined;
  size?: string | number;
  bold?: boolean;
  noWrap?: boolean;
  color?: string;
  transformValue?: boolean;
  align?: string;
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
  component?: ElementType;
  className?: string;
  size?: string;
  italic?: boolean;
  strikethrough?: boolean;
  textShadow?: string;
  children?: ReactNode;
  bold?: boolean;
  underline?: boolean;
  uppercase?: boolean;
  capitalize?: boolean;
  lowercase?: boolean;
  letterSpacing?: string;
  textTransform?: string;
  [key: string]: unknown;
}

export interface LoaderProps {
  useRedux?: boolean;
  show?: boolean;
  message?: ReactNode;
  theme?: string;
}

export interface SimplePanelHeaderProps {
  icon?: ReactNode;
  title?: ReactNode;
  badgeCount?: number;
  metaItems?: ReactNode[];
  showMeta?: boolean;
}

export interface FiscalReceiptsPanelProps {
  data?: unknown;
}

export interface InventoryFilterAndSortProps {
  tooltip?: ReactNode;
  tooltipDescription?: ReactNode;
  tooltipPlacement?: string;
  contextKey?: string;
}

export interface PresetsSectionProps {
  presets?: unknown[];
  value?: unknown;
  mode?: string;
  isMobile?: boolean;
  onPresetClick?: (preset: unknown) => void;
  showPresetsDropdown?: boolean;
  setShowPresetsDropdown?: (value: boolean) => void;
  presetsDropdownRef?: RefObject<HTMLElement>;
  layout?: string;
}
