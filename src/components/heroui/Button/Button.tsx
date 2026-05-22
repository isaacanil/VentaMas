import { Button as HeroButton } from '@heroui/react';
import type { ButtonProps } from '@heroui/react';

const VmButtonRoot = (props: ButtonProps) => {
  return <HeroButton {...props} />;
};

export const VmButton = Object.assign(VmButtonRoot, {
  Root: VmButtonRoot,
});

export type { ButtonProps as VmButtonProps } from '@heroui/react';
