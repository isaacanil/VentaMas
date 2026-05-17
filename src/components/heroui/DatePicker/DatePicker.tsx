import { DatePicker as HeroDatePicker } from '@heroui/react';
import styled from 'styled-components';

import { vmSurfaceBorderStyles } from '../styles';

const VmDatePickerRoot = ((props) => {
  return <HeroDatePicker {...props} />;
}) as typeof HeroDatePicker;

const VmDatePickerPopover = styled(HeroDatePicker.Popover)`
  ${vmSurfaceBorderStyles}
`;

export const VmDatePicker = Object.assign(VmDatePickerRoot, {
  Root: VmDatePickerRoot,
  Trigger: HeroDatePicker.Trigger,
  TriggerIndicator: HeroDatePicker.TriggerIndicator,
  Popover: VmDatePickerPopover,
});

export type {
  DatePickerPopoverProps as VmDatePickerPopoverProps,
  DatePickerRootProps as VmDatePickerProps,
  DatePickerTriggerIndicatorProps as VmDatePickerTriggerIndicatorProps,
  DatePickerTriggerProps as VmDatePickerTriggerProps,
} from '@heroui/react';
