import { motion } from "framer-motion";

const transition = {
  duration: 0.5,
  ease: "easeInOut",
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
};

export const Transition = ({children}) => {
  return (
    <motion.div
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={Variants}
  >
    {children}
  </motion.div>
  )
}
