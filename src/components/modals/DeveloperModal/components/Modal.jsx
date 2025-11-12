import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import styled from 'styled-components';

export const Modal = ({ visible, onClose, children }) => {
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
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
`;

const ModalContainer = styled(motion.div)`
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 8px;
    width: 90%;
    max-width: 1200px;
    height: 99vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
`;

const CloseButton = styled.button`
    position: absolute;
    top: 8px;
    right: 16px;
    background: none;
    border: none;
    color: #999;
    font-size: 24px;
    cursor: pointer;
    z-index: 10;
    
    &:hover {
        color: #fff;
    }
`;
