// Candidate for deletion: no current modules import this page transition wrapper.
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const pageTransition = {
  initial: {
    opacity: 0,
    // x: -20
  },
  animate: {
    opacity: 1,
    // x: 0
  },
  exit: {
    opacity: 0,
    // x: 20
  }
};

export const PageTransition = ({ children }) => {
  const location = useLocation();
  
  return (
    <motion.div
      key={location.pathname}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ overflow: 'hidden' }}
      variants={pageTransition}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
};
