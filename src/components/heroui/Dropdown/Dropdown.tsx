import { Button as HeroButton, Dropdown as HeroDropdown } from '@heroui/react';
import type { ButtonProps as HeroButtonProps } from '@heroui/react';
import styled from 'styled-components';

import { vmControlBorderStyles, vmSurfaceBorderStyles } from '../styles';

const VmDropdownButton = styled(HeroButton).attrs({
  variant: 'secondary',
})`
  ${vmControlBorderStyles}
  color: var(--ds-color-text-primary);
  background: var(--ds-color-bg-surface);
`;

const VmDropdownPopover = styled(HeroDropdown.Popover)`
  ${vmSurfaceBorderStyles}
`;

export const VmDropdown = Object.assign(HeroDropdown, {
  Root: HeroDropdown.Root,
  Button: VmDropdownButton,
  Trigger: HeroDropdown.Trigger,
  Popover: VmDropdownPopover,
  Menu: HeroDropdown.Menu,
  Section: HeroDropdown.Section,
  Item: HeroDropdown.Item,
  ItemIndicator: HeroDropdown.ItemIndicator,
  SubmenuIndicator: HeroDropdown.SubmenuIndicator,
  SubmenuTrigger: HeroDropdown.SubmenuTrigger,
});

export type VmDropdownButtonProps = HeroButtonProps;
export type {
  DropdownItemIndicatorProps as VmDropdownItemIndicatorProps,
  DropdownItemProps as VmDropdownItemProps,
  DropdownMenuProps as VmDropdownMenuProps,
  DropdownPopoverProps as VmDropdownPopoverProps,
  DropdownRootProps as VmDropdownProps,
  DropdownSectionProps as VmDropdownSectionProps,
  DropdownSubmenuIndicatorProps as VmDropdownSubmenuIndicatorProps,
  DropdownSubmenuTriggerProps as VmDropdownSubmenuTriggerProps,
  DropdownTriggerProps as VmDropdownTriggerProps,
} from '@heroui/react';
