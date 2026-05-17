import { InputOTP as HeroInputOTP } from '@heroui/react';
import styled from 'styled-components';

import { vmControlBorderStyles, vmControlFocusRing } from '../styles';

const VmInputOTPRoot = ((props) => {
  return <HeroInputOTP {...props} />;
}) as typeof HeroInputOTP;

const VmInputOTPSlot = styled(HeroInputOTP.Slot)`
  ${vmControlBorderStyles}

  &[data-active='true'] {
    border-color: var(--ds-color-border-focus);
    box-shadow: ${vmControlFocusRing};
  }
`;

export const VmInputOTP = Object.assign(VmInputOTPRoot, {
  Root: VmInputOTPRoot,
  Group: HeroInputOTP.Group,
  Slot: VmInputOTPSlot,
  Separator: HeroInputOTP.Separator,
});

export type {
  InputOTPGroupProps as VmInputOTPGroupProps,
  InputOTPRootProps as VmInputOTPProps,
  InputOTPSeparatorProps as VmInputOTPSeparatorProps,
  InputOTPSlotProps as VmInputOTPSlotProps,
} from '@heroui/react';
