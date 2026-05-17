import { DateField as HeroDateField } from '@heroui/react';
import type { ComponentProps } from 'react';
import styled from 'styled-components';

import { vmControlBorderStyles } from '../styles';

const VmDateFieldRoot = ((props) => {
  return <HeroDateField {...props} />;
}) as typeof HeroDateField;

const VmDateFieldGroup = styled(HeroDateField.Group)`
  ${vmControlBorderStyles}
`;

export const VmDateField = Object.assign(VmDateFieldRoot, {
  Root: VmDateFieldRoot,
  Group: VmDateFieldGroup,
  Input: HeroDateField.Input,
  InputContainer: HeroDateField.InputContainer,
  Segment: HeroDateField.Segment,
  Prefix: HeroDateField.Prefix,
  Suffix: HeroDateField.Suffix,
});

export type VmDateFieldGroupProps = ComponentProps<typeof HeroDateField.Group>;
export type VmDateFieldInputProps = ComponentProps<typeof HeroDateField.Input>;
export type VmDateFieldInputContainerProps = ComponentProps<
  typeof HeroDateField.InputContainer
>;
export type VmDateFieldPrefixProps = ComponentProps<typeof HeroDateField.Prefix>;
export type VmDateFieldSegmentProps = ComponentProps<typeof HeroDateField.Segment>;
export type VmDateFieldSuffixProps = ComponentProps<typeof HeroDateField.Suffix>;
export type { DateFieldRootProps as VmDateFieldProps } from '@heroui/react';
