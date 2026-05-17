import { TimeField as HeroTimeField } from '@heroui/react';
import type { ComponentProps } from 'react';
import styled from 'styled-components';

import { vmControlBorderStyles } from '../styles';

const VmTimeFieldRoot = ((props) => {
  return <HeroTimeField {...props} />;
}) as typeof HeroTimeField;

const VmTimeFieldGroup = styled(HeroTimeField.Group)`
  ${vmControlBorderStyles}
`;

export const VmTimeField = Object.assign(VmTimeFieldRoot, {
  Root: VmTimeFieldRoot,
  Group: VmTimeFieldGroup,
  Input: HeroTimeField.Input,
  InputContainer: HeroTimeField.InputContainer,
  Segment: HeroTimeField.Segment,
  Prefix: HeroTimeField.Prefix,
  Suffix: HeroTimeField.Suffix,
});

export type VmTimeFieldGroupProps = ComponentProps<typeof HeroTimeField.Group>;
export type VmTimeFieldInputProps = ComponentProps<typeof HeroTimeField.Input>;
export type VmTimeFieldInputContainerProps = ComponentProps<
  typeof HeroTimeField.InputContainer
>;
export type VmTimeFieldPrefixProps = ComponentProps<typeof HeroTimeField.Prefix>;
export type VmTimeFieldSegmentProps = ComponentProps<typeof HeroTimeField.Segment>;
export type VmTimeFieldSuffixProps = ComponentProps<typeof HeroTimeField.Suffix>;
export type { TimeFieldRootProps as VmTimeFieldProps } from '@heroui/react';
