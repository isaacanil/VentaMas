import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useRef } from 'react';
import styled from 'styled-components';

import { useClickOutSide } from '../../../../../../../../../hooks/useClickOutSide';

export const ActionMenu = ({ options = [], disabled }) => {
  const [visible, setVisible] = useState(false);
  const menuRef = useRef(null);

  useClickOutSide(menuRef, visible, () => setVisible(false));

return (
    <>
        <Container>
            <MenuButton onClick={() => setVisible(!visible)} disabled={disabled}>
                <DotsIcon disabled={disabled}>⋮</DotsIcon>
            </MenuButton>
        </Container>
        <AnimatePresence>
            {visible && (
                <MenuWrapper
                    ref={menuRef}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                >
                    <MenuHeader>
                        <HeaderTitle>Más Acciones</HeaderTitle>
                        <CloseButton onClick={() => setVisible(false)}>
                            <FontAwesomeIcon icon={faTimes} />
                        </CloseButton>
                    </MenuHeader>
                    <MenuContainer>
                        {options.map((option, index) => (
                            <MenuItem 
                                key={index}
                                onClick={() => {
                                    option.action();
                                    setVisible(false);
                                }}
                                disabled={option.disabled}
                                $theme={option.theme}
                            >
                                {option.icon && <IconWrapper $theme={option.theme}>{option.icon}</IconWrapper>}
                                {option.text}
                            </MenuItem>
                        ))}
                    </MenuContainer>
                </MenuWrapper>
            )}
        </AnimatePresence>
    </>
);
};

const Container = styled.div`
  position: relative;
  width: 100%;
`;

const MenuButton = styled.button`
  background: transparent;
  border: none;
  display: grid;
  place-items: center;
  height: 32px;
  width: 32px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.6 : 1};
`;

const DotsIcon = styled.span`
  font-size: 22px;
  line-height: 0;
  color: ${props => props.disabled ? '#94a3b8' : '#1e293b'};
  font-weight: 600;
`;

const MenuWrapper = styled(motion.div)`
  position: absolute;
  border: 1px solid #cfcfcf;
  bottom: 8px;
  left: 2px;
  right: 2px;
  margin: 0 auto;
  width: 95%;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.397);
  z-index: 1000;
`;

const MenuHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 12px;
  border-bottom: 1px solid #eee;
`;

const HeaderTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  color: #0f172a;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const MenuContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 4px; 
  gap: 0.2em;
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px; 
  padding: 10px;  
  border: none;
  background: ${props => props.$theme?.background || '#ffffff'};
  border-radius: 6px; 
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.6 : 1};
  width: 100%;
  text-align: left;
  font-size: 15px;
  font-weight: 500;
  color: ${props => props.$theme?.color || '#475569'};
  transition: all 0.2s;
  
  &:hover {
    background: ${props => {
      if (props.disabled) return props.$theme?.background || '#ffffff';
      return props.$theme?.backgroundHover || '#f0f0f0';
    }};
    color: ${props => {
      if (props.disabled) return props.$theme?.color || '#475569';
      return props.$theme?.colorHover || '#0f172a';
    }};
  }
`;

const IconWrapper = styled.span`
  display: flex;
  align-items: center;
  font-size: 16px;
  color: ${props => props.$theme?.iconColor || '#64748b'};
`;

const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 16px;
  color: #64748b;
  font-weight: 500;
  border-radius: 4px;
  
  &:hover {
    background: #f0f0f0;
    color: #0f172a;
  }
`;

export default ActionMenu;
