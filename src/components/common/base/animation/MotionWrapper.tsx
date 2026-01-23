import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps, Transition, Variants } from 'framer-motion';

const defaultVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const defaultTransition: Transition = { duration: 0.5 };

type MotionWrapperProps = {
  children: ReactNode;
  variants?: Variants;
  initial?: HTMLMotionProps<'div'>['initial'];
  animate?: HTMLMotionProps<'div'>['animate'];
  exit?: HTMLMotionProps<'div'>['exit'];
  transition?: Transition;
} & Omit<
  HTMLMotionProps<'div'>,
  'initial' | 'animate' | 'exit' | 'transition' | 'variants' | 'children'
>;

export const MotionWrapper = ({
  children,
  variants = defaultVariants,
  initial = 'hidden',
  animate = 'visible',
  exit = 'hidden',
  transition = defaultTransition,
  ...rest
}: MotionWrapperProps) => (
  <motion.div
    variants={variants}
    initial={initial}
    animate={animate}
    exit={exit}
    transition={transition}
    {...rest}
  >
    {children}
  </motion.div>
);
