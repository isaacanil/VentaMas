import { motion } from 'framer-motion';

const defaultVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const defaultTransition = { duration: 0.5 };

export const MotionWrapper = ({
    children,
    variants = defaultVariants,
    initial = "hidden",
    animate = "visible",
    exit = "hidden",
    transition = defaultTransition
}) => (
    <motion.div 
        variants={variants}
        initial={initial}
        animate={animate}
        exit={exit}
        transition={transition}
    >
        {children}
    </motion.div>
);


