import { Input as HeroInput } from '@heroui/react';
import styled from 'styled-components';

import { vmControlBorderStyles } from '../styles';

const VmInputRoot = styled(HeroInput)`
  ${vmControlBorderStyles}
`;

export const VmInput = Object.assign(VmInputRoot, {
  Root: VmInputRoot,
});

export type { InputRootProps as VmInputProps } from '@heroui/react';
