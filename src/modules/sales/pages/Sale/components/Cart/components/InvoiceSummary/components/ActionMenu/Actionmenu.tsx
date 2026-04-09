import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';
import React, { useState, useRef } from 'react';
import type { ReactNode } from 'react';
import styled from 'styled-components';

import { useClickOutSide } from '@/hooks/useClickOutSide';

type ActionMenuTheme = {
  color?: string;
  colorHover?: string;
  background?: string;
  backgroundHover?: string;
  iconColor?: string;
};

type ActionMenuOption = {
  text: string;
  action: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  theme?: ActionMenuTheme;
};

type ActionMenuProps = {
  options?: ActionMenuOption[];
  disabled?: boolean;
};

const EMPTY_ACTION_MENU_OPTIONS: ActionMenuOption[] = [];

type ThemeProps = {
  $theme?: ActionMenuTheme;
  disabled?: boolean;
};

type DotsIconProps = {
  $disabled?: boolean;
};

export const ActionMenu = ({
  options = EMPTY_ACTION_MENU_OPTIONS,
  disabled,
}: ActionMenuProps) => {
  const [visible, setVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useClickOutSide(menuRef, visible, () => setVisible(false));

  return (
    <LazyMotion features={domAnimation}>
      <>
        <Container>
          <MenuButton onClick={() => setVisible(!visible)} disabled={disabled}>
            <DotsIcon $disabled={disabled}>⋮</DotsIcon>
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
                {options.map((option) => (
                  <MenuItem
                    key={option.text}
                    onClick={() => {
                      option.action();
                      setVisible(false);
                    }}
                    disabled={option.disabled}
                    $theme={option.theme}
                  >
                    {option.icon && (
                      <IconWrapper $theme={option.theme}>
                        {option.icon}
                      </IconWrapper>
                    )}
                    {option.text}
                  </MenuItem>
                ))}
              </MenuContainer>
            </MenuWrapper>
          )}
        </AnimatePresence>
      </>
    </LazyMotion>
  );
};

const Container = styled.div`
  position: relative;
  width: 100%;
`;

const MenuButton = styled.button`
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  cursor: ${(props: { disabled?: boolean }) =>
    props.disabled ? 'not-allowed' : 'pointer'};
  background: transparent;
  border: none;
  opacity: ${(props: { disabled?: boolean }) => (props.disabled ? 0.6 : 1)};
`;

const DotsIcon = styled.span<DotsIconProps>`
  font-size: 22px;
  font-weight: 600;
  line-height: 0;
  color: ${({ $disabled }) => ($disabled ? '#94a3b8' : '#1e293b')};
`;

const MenuWrapper = styled(m.div)`
  position: absolute;
  right: 2px;
  bottom: 8px;
  left: 2px;
  z-index: 1000;
  width: 95%;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #cfcfcf;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 39.7%);
`;

const MenuHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid #eee;
`;

const HeaderTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const MenuContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2em;
  padding: 4px;
`;

const MenuItem = styled.button<ThemeProps>`
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  padding: 10px;
  font-size: 15px;
  font-weight: 500;
  color: ${(props: ThemeProps) => props.$theme?.color || '#475569'};
  text-align: left;
  cursor: ${(props: ThemeProps) =>
    props.disabled ? 'not-allowed' : 'pointer'};
  background: ${(props: ThemeProps) => props.$theme?.background || '#ffffff'};
  border: none;
  border-radius: 6px;
  opacity: ${(props: ThemeProps) => (props.disabled ? 0.6 : 1)};
  transition: all 0.2s;

  &&:hover {
    color: ${(props: ThemeProps) => {
      if (props.disabled) return props.$theme?.color || '#475569';
      return props.$theme?.colorHover || '#0f172a';
    }};
    background: ${(props: ThemeProps) => {
      if (props.disabled) return props.$theme?.background || '#ffffff';
      return props.$theme?.backgroundHover || '#f0f0f0';
    }};
  }
`;

const IconWrapper = styled.span<ThemeProps>`
  display: flex;
  align-items: center;
  font-size: 16px;
  color: ${(props: ThemeProps) => props.$theme?.iconColor || '#64748b'};
`;

const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  font-size: 16px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 4px;

  &&:hover {
    color: #0f172a;
    background: #f0f0f0;
  }
`;

export default ActionMenu;
