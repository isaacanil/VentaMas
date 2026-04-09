import { m, useReducedMotion } from 'framer-motion';

const transition = {
  duration: 0.5,
  ease: 'easeInOut',
};

const Variants = {
  visible: {
    opacity: 1,
    transition,
  },
  hidden: {
    opacity: 0.5,

    transition,
  },
  exit: {
    opacity: 0.5,
    transition,
  },
} as any;

export const Transition = ({ children }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <m.div
      initial={prefersReducedMotion ? false : 'hidden'}
      animate="visible"
      exit="exit"
      variants={Variants}
      transition={prefersReducedMotion ? { duration: 0 } : undefined}
    >
      {children}
    </m.div>
  );
};
