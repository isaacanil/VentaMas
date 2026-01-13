// @ts-nocheck
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import styled, { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  .ant-dropdown {
    z-index: 10000001 !important;
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 2.75em;
  left: 0;
  z-index: 99;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(2px);
  will-change: opacity;
`;

const MotionContainer = styled(motion.div)`
  position: fixed;
  top: 3em;
  right: 0;
  z-index: 100000;
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  width: 100%;
  max-width: 700px;
  height: calc(100vh - 3.2em);
  overflow: hidden;
  background-color: #fff;
  border: 1px solid #c7c7c7;
  border-radius: 10px;
`;

const containerVariants = {
  hidden: { y: '-100%', opacity: 0 }, // <- evita scaleY
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 24,
      mass: 0.4, // <- más pequeño = menos rebote
    },
  },
  exit: {
    y: '-100%',
    opacity: 0,
    transition: { duration: 0.25 }, // cierra rapidito
  },
};

export const ClientSelectionModal = ({ isOpen, onClose, children }) => {
  const containerRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        const isClickOnClientControlInput =
          event.target.closest('.ant-input') ||
          event.target.closest('.ant-input-affix-wrapper') ||
          event.target.closest('[data-client-control-input]') ||
          event.target.closest('.ant-btn') ||
          event.target.hasAttribute('data-client-control-input');

        if (!isClickOnClientControlInput) {
          onClose();
        }
      }
    };

    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <>
      <GlobalStyle />
      <AnimatePresence mode="wait" initial={false}>
        {isOpen && (
          <>
            <Overlay
              key="ov"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={onClose}
            />
            <MotionContainer
              ref={containerRef}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {children}
            </MotionContainer>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
