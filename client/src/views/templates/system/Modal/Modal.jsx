import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Header';
import { Body } from './components/Body';
import { Footer } from './components/Footer';



// Componente del Modal
export const Modal = ({ open, title, onCancel, onOk, styles, okText, cancelText, children }) => {
  // Efecto para bloquear el scroll cuando el modal está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [open]);

  return (
    <AnimatePresence mode="wait">
      {open && (
        <ModalBackdrop
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onCancel}
        >
          <ModalContent
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            customStyles={styles}
            onClick={(e) => e.stopPropagation()}
          >
            <Header title={title} />
            <Body>{children}</Body>
            <Footer 
            onCancel={onCancel} 
            onOk={onOk} 
            okText={okText} 
            cancelText={cancelText} 
            />
          </ModalContent>
        </ModalBackdrop>
      )}
    </AnimatePresence>
  );
};

// Estilos para el fondo del modal
const ModalBackdrop = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

// Estilos para el contenido del modal
const ModalContent = styled(motion.div)`
  background: white;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 100%;
  overflow: hidden;
  ${({ customStyles }) => customStyles}
`;

// Variantes para la animación del modal
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const modalVariants = {
  hidden: { opacity: 0, y: '-100vh' },
  visible: { opacity: 1, y: '0' },
  exit: { opacity: 0, y: '100vh' }
};