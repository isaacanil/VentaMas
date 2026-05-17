import { Select as HeroSelect } from '@heroui/react';
import type { SelectRootProps } from '@heroui/react';
import styled from 'styled-components';

import { vmControlBorderStyles, vmSurfaceBorderStyles } from '../styles';

const VmSelectTrigger = styled(HeroSelect.Trigger)`
  ${vmControlBorderStyles}
`;

const VmSelectPopover = styled(HeroSelect.Popover)`
  ${vmSurfaceBorderStyles}
  box-shadow: none !important;
  filter: none;
`;

const VmSelectRoot = <
  T extends object = object,
  M extends 'single' | 'multiple' = 'single',
>(
  props: SelectRootProps<T, M>,
) => {
  return <HeroSelect {...props} />;
};

export const VmSelect = Object.assign(VmSelectRoot, {
  Root: VmSelectRoot,
  Trigger: VmSelectTrigger,
  Value: HeroSelect.Value,
  Indicator: HeroSelect.Indicator,
  Popover: VmSelectPopover,
});

export type {
  SelectIndicatorProps as VmSelectIndicatorProps,
  SelectPopoverProps as VmSelectPopoverProps,
  SelectRootProps as VmSelectProps,
  SelectTriggerProps as VmSelectTriggerProps,
  SelectValueProps as VmSelectValueProps,
} from '@heroui/react';
