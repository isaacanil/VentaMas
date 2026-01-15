// components/WarningPill/WarningPill.tsx
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useRef } from 'react';
import type { ReactNode } from 'react';
import styled from 'styled-components';

import { useClickOutSide } from '@/hooks/useClickOutSide';

type WarningPillProps = {
  message?: string | null;
  icon?: ReactNode;
};


const WarningPill = ({ message, icon = '⚠️' }: WarningPillProps) => {
  const [showMessage, setShowMessage] = useState(false);
  const messageRef = useRef<HTMLDivElement | null>(null);

  // Fix the issue with infinite updates by passing the correct parameters
  // The second parameter should be a condition to track, not the state itself
  useClickOutSide(messageRef, showMessage, () => {
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
  right: 330px;
  bottom: 40px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  cursor: pointer;
  background-color: #fffbe6;
  border: 1px solid #ffd666;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgb(0 0 0 / 15%);
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  &&:hover {
    box-shadow: 0 4px 12px rgb(0 0 0 / 20%);
    transform: scale(1.1);
  }
`;

const PillIcon = styled.span`
  font-size: 16px;
  color: #fa8c16;
`;

// Estilos para el mensaje emergente
const MessagePopup = styled(motion.div)`
  position: fixed;
  right: 30px;
  bottom: 80px;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  width: 320px;
  padding: 16px;
  background-color: #fffbe6;
  border: 1px solid #ffd666;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
`;

const MessageContent = styled.div`
  display: flex;
  flex: 1;
  align-items: flex-start;
`;

const MessageIcon = styled.span`
  flex-shrink: 0;
  margin-right: 12px;
  font-size: 18px;
  color: #fa8c16;
`;

const MessageText = styled.div`
  font-size: 14px;
  line-height: 1.5;
  color: #d48806;
`;

const CloseButton = styled.button`
  align-self: flex-start;
  padding: 0;
  margin-left: 8px;
  font-size: 20px;
  line-height: 1;
  color: #d48806;
  cursor: pointer;
  background: none;
  border: none;
  opacity: 0.6;
  transition: opacity 0.2s;

  &&:hover {
    opacity: 1;
  }
`;

export default WarningPill;
