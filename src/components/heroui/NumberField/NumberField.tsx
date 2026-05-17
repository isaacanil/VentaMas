import { NumberField as HeroNumberField } from '@heroui/react';
import type { ComponentProps } from 'react';
import styled from 'styled-components';

import { vmControlBorderStyles } from '../styles';

const VmNumberFieldRoot = ((props) => {
  return <HeroNumberField {...props} />;
}) as typeof HeroNumberField;

const VmNumberFieldGroup = styled(HeroNumberField.Group)`
  ${vmControlBorderStyles}
  display: flex;
  grid-template-columns: none;
  align-items: center;
  width: 100%;

  .number-field__input,
  [data-slot='number-field-input'] {
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
  }

  .number-field__decrement-button,
  .number-field__increment-button {
    flex: 0 0 40px;
  }
`;

export const VmNumberField = Object.assign(VmNumberFieldRoot, {
  Root: VmNumberFieldRoot,
  Group: VmNumberFieldGroup,
  Input: HeroNumberField.Input,
  IncrementButton: HeroNumberField.IncrementButton,
  DecrementButton: HeroNumberField.DecrementButton,
});

export type VmNumberFieldGroupProps = ComponentProps<
  typeof HeroNumberField.Group
>;
export type VmNumberFieldInputProps = ComponentProps<
  typeof HeroNumberField.Input
>;
export type VmNumberFieldIncrementButtonProps = ComponentProps<
  typeof HeroNumberField.IncrementButton
>;
export type VmNumberFieldDecrementButtonProps = ComponentProps<
  typeof HeroNumberField.DecrementButton
>;
export type { NumberFieldRootProps as VmNumberFieldProps } from '@heroui/react';
