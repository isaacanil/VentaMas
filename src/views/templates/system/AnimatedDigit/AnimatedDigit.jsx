// AnimatedDigit.js
import { motion } from 'framer-motion';
import React from 'react';
import styled from 'styled-components';

const AnimatedDigit = ({ digit }) => {
  return (
    <Digit
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      key={digit} // Para que se reanime cuando el número cambia
    >
      {digit}
    </Digit>
  );
};

const Digit = styled(motion.span)`
  display: flex;
  align-items: center;
  font-weight: 600;
`;

export default AnimatedDigit;
