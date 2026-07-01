import type { DateTime } from 'luxon';
import type { CSSProperties, MouseEvent, RefObject } from 'react';

export type DatePickerMode = 'single' | 'range';
export type DatePickerPresetLayout = 'grid' | 'sidebar';

export type DatePickerSingleValue = DateTime | null;
export type DatePickerRangeValue = Array<DateTime | null>;
export type DatePickerValue =
  | DatePickerSingleValue
  | DatePickerRangeValue
  | null;

export interface DatePickerPreset {
  label: string;
  value: DatePickerValue;
  group?: string;
}

export interface DatePickerInputProps {
  value?: string;
  placeholder?: string;
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
  allowClear?: boolean;
  hasValue?: boolean;
  onClear?: (event: MouseEvent<HTMLElement>) => void;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
}

export interface DatePickerProps extends Omit<
  DatePickerInputProps,
  'value' | 'onClick' | 'onClear' | 'allowClear' | 'hasValue'
> {
  mode?: DatePickerMode;
  value?: DatePickerValue;
  onChange: (value: DatePickerValue) => void;
  format?: string;
  allowClear?: boolean;
  presets?: DatePickerPreset[];
  showPresets?: boolean;
}

export interface UseDatePickerArgs {
  mode: DatePickerMode;
  value: DatePickerValue;
  onChange: (value: DatePickerValue) => void;
  presets: DatePickerPreset[];
}

export interface PresetsSectionProps {
  presets?: DatePickerPreset[];
  value?: DatePickerValue;
  mode?: DatePickerMode;
  isMobile?: boolean;
  onPresetClick?: (preset: DatePickerPreset) => void;
  showPresetsDropdown?: boolean;
  setShowPresetsDropdown?: (value: boolean) => void;
  presetsDropdownRef?: RefObject<HTMLDivElement>;
  layout?: DatePickerPresetLayout;
}
