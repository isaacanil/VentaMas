import { SearchField as HeroSearchField } from '@heroui/react';
import styled from 'styled-components';

import { vmControlBorderStyles } from '../styles';

const VmSearchFieldRoot = ((props) => {
  return <HeroSearchField {...props} />;
}) as typeof HeroSearchField;

const VmSearchFieldGroup = styled(HeroSearchField.Group)`
  ${vmControlBorderStyles}
`;

export const VmSearchField = Object.assign(VmSearchFieldRoot, {
  Root: VmSearchFieldRoot,
  Group: VmSearchFieldGroup,
  Input: HeroSearchField.Input,
  SearchIcon: HeroSearchField.SearchIcon,
  ClearButton: HeroSearchField.ClearButton,
});

export type {
  SearchFieldClearButtonProps as VmSearchFieldClearButtonProps,
  SearchFieldGroupProps as VmSearchFieldGroupProps,
  SearchFieldInputProps as VmSearchFieldInputProps,
  SearchFieldRootProps as VmSearchFieldProps,
  SearchFieldSearchIconProps as VmSearchFieldSearchIconProps,
} from '@heroui/react';
