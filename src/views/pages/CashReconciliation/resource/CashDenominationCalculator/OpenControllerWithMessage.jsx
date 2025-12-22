import { motion } from 'framer-motion';
import React from 'react';
import styled from 'styled-components';

import { icons } from '../../../../../constants/icons/icons';

export const OpenControllerWithMessage = ({ isExpanded, handleExpanded }) => {
  const variants = {
    open: {
      opacity: 1,
      y: 0,
      boxShadow: 'inset 0px 0px 10px 0px rgba(0, 0, 0, 0.100)',
      backdropFilter: 'blur(2.5px)',
    },
    closed: {
      opacity: 0,
      y: '-100%',
      boxShadow: 'none',
      blur: 'blur(0px)',
    },
  };
  return (
    <Container
      animate={!isExpanded ? 'open' : 'closed'}
      variants={variants}
      transition={{ duration: 0.5 }}
      onClick={handleExpanded}
    >
      Expandir
      <span>{icons.arrows.UpRightAndDownLeftFromCenter}</span>
    </Container>
  );
};
const Container = styled(motion.div)`
  position: absolute;
  display: flex;
  gap: 0.5em;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`;
