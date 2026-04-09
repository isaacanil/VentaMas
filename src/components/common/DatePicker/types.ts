import type { InputProps } from 'antd';
import type { DateTime } from 'luxon';
import type { CSSProperties, MouseEvent, RefObject } from 'react';

export type DatePickerMode = 'single' | 'range';

export type DatePickerSingleValue = DateTime | null;
export type DatePickerRangeValue = [DateTime | null, DateTime | null];
export type DatePickerValue =
  | DatePickerSingleValue
  | DatePickerRangeValue
  | null;

export interface DatePickerPreset {
  label: string;
  value: DatePickerValue;
  group?: string;
}

export interface DatePickerInputProps extends Omit<
  InputProps,
  'value' | 'onChange' | 'onClick' | 'onClear'
> {
  value?: string;
  allowClear?: boolean;
  hasValue?: boolean;
  onClear?: (event: MouseEvent<HTMLElement>) => void;
  onClick?: () => void;
}

export interface DatePickerProps extends Omit<
  DatePickerInputProps,
  'value' | 'onClick' | 'onClear' | 'allowClear' | 'hasValue'
> {
  mode?: DatePickerMode;
  value?: DatePickerValue;
  onChange: (value: DatePickerValue) => void;
  placeholder?: string;
  format?: string;
  allowClear?: boolean;
  size?: InputProps['size'];
  disabled?: boolean;
  presets?: DatePickerPreset[];
  className?: string;
  style?: CSSProperties;
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
  layout?: string;
}
