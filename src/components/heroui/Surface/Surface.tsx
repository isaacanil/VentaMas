import { Surface as HeroSurface } from '@heroui/react';

const VmSurfaceRoot = ((props) => {
  return <HeroSurface {...props} />;
}) as typeof HeroSurface;

export const VmSurface = Object.assign(VmSurfaceRoot, {
  Root: VmSurfaceRoot,
});

export type { SurfaceRootProps as VmSurfaceProps } from '@heroui/react';
