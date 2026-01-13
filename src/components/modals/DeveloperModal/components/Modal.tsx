import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import styled from 'styled-components';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal = ({ visible, onClose, children }: ModalProps) => {
  if (!visible) return null;

  return (
    <AnimatePresence>
      <Overlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <ModalContainer
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <CloseButton onClick={onClose}>×</CloseButton>
          {children}
        </ModalContainer>
      </Overlay>
    </AnimatePresence>
  );
};

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 70%);
`;

const ModalContainer = styled(motion.div)`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 90%;
  max-width: 1200px;
  height: 99vh;
  overflow: hidden;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 16px;
  z-index: 10;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  background: none;
  border: none;

  &:hover {
    color: #fff;
  }
`;
