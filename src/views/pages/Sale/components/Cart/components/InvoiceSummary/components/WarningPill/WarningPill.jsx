// components/WarningPill/WarningPill.jsx
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useRef } from 'react';
import styled from 'styled-components';

import { useClickOutSide } from '../../../../../../../../../hooks/useClickOutSide';

const WarningPill = ({ message, icon = '⚠️' }) => {
  const [showMessage, setShowMessage] = useState(false);
  const messageRef = useRef(null);

  // Fix the issue with infinite updates by passing the correct parameters
  // The second parameter should be a condition to track, not the state itself
  useClickOutSide(messageRef, () => {
    if (showMessage) {
      setShowMessage(false);
    }
  });

  if (!message) return null;

  const toggleMessage = () => setShowMessage((prev) => !prev);

  return (
    <>
      {/* Píldora flotante circular (siempre visible) */}
      <FloatingPill onClick={toggleMessage}>
        <PillIcon>{icon}</PillIcon>
      </FloatingPill>

      {/* Mensaje emergente (aparece solo al hacer clic) */}
      <AnimatePresence>
        {showMessage && (
          <MessagePopup
            ref={messageRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <MessageContent>
              <MessageIcon>{icon}</MessageIcon>
              <MessageText>{message}</MessageText>
            </MessageContent>
            <CloseButton onClick={toggleMessage}>×</CloseButton>
          </MessagePopup>
        )}
      </AnimatePresence>
    </>
  );
};

// Estilos para la píldora flotante
const FloatingPill = styled.div`
  position: fixed;
  bottom: 40px;
  right: 330px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #fffbe6;
  border: 1px solid #ffd666;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 2;
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`;

const PillIcon = styled.span`
  font-size: 16px;
  color: #fa8c16;
`;

// Estilos para el mensaje emergente
const MessagePopup = styled(motion.div)`
  position: fixed;
  bottom: 80px;
  right: 30px;
  width: 320px;
  background-color: #fffbe6;
  border: 1px solid #ffd666;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 20;
  display: flex;
  justify-content: space-between;
`;

const MessageContent = styled.div`
  display: flex;
  align-items: flex-start;
  flex: 1;
`;

const MessageIcon = styled.span`
  font-size: 18px;
  color: #fa8c16;
  margin-right: 12px;
  flex-shrink: 0;
`;

const MessageText = styled.div`
  color: #d48806;
  font-size: 14px;
  line-height: 1.5;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #d48806;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  margin-left: 8px;
  line-height: 1;
  align-self: flex-start;
  opacity: 0.6;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

export default WarningPill;
