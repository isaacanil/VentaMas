import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion';
import type { ReactNode } from 'react';

import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

type ReducedMotionProviderProps = {
  children: ReactNode;
};

export const ReducedMotionProvider = ({
  children,
}: ReducedMotionProviderProps) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion={prefersReducedMotion ? 'always' : 'user'}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
};
