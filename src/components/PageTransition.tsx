import { useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import { TransitionFrame } from './PageTransition.styles';

const PAGE_TRANSITION_VARIANTS = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
};

const PAGE_TRANSITION = { duration: 0.5 };
const REDUCED_MOTION_TRANSITION = { duration: 0 };

interface PageTransitionProps {
  children: ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  return (
    <TransitionFrame
      key={location.pathname}
      initial={prefersReducedMotion ? false : 'initial'}
      animate="animate"
      exit="exit"
      variants={PAGE_TRANSITION_VARIANTS}
      transition={
        prefersReducedMotion ? REDUCED_MOTION_TRANSITION : PAGE_TRANSITION
      }
    >
      {children}
    </TransitionFrame>
  );
};
