import React, { useId, useRef, useState } from 'react';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { Button } from '@/components/ui/Button/Button';
import { useModalFocusTrap } from '@/hooks/useModalFocusTrap';

import Modal from './Modal';

interface MenuOption {
  id: string;
  label: string;
  component: React.ReactNode;
}

interface MenuProps {
  isOpen?: boolean;
  onClose?: () => void;
  options?: MenuOption[];
}

const EMPTY_MENU_OPTIONS: MenuOption[] = [];
const NOOP = () => {};

const Menu = ({
  isOpen = true,
  onClose = NOOP,
  options = EMPTY_MENU_OPTIONS,
}: MenuProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<MenuOption | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useModalFocusTrap({
    open: isOpen && !isModalOpen,
    containerRef,
    onEscape: onClose,
  });

  const openModal = (option: MenuOption) => {
    setSelectedOption(option);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedOption(null);
    setIsModalOpen(false);
  };

  return (
    isOpen && (
      <Backdrop>
        <MenuContainer
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
        >
          <Header>
            <h1 id={titleId}>Configuraciones</h1>
            <Button title={icons.operationModes.close} onClick={onClose} />
          </Header>
          {options?.map((option) => (
            <MenuItem
              key={option.id}
              type="button"
              onClick={() => openModal(option)}
            >
              {option.label}
            </MenuItem>
          ))}
          {isModalOpen && selectedOption && (
            <Modal content={selectedOption.component} closeModal={closeModal} />
          )}
        </MenuContainer>
      </Backdrop>
    )
  );
};

export default Menu;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1300;
  background-color: rgb(0 0 0 / 50%);
`;

const MenuContainer = styled.div`
  position: relative;
  display: grid;
  align-content: start;
  width: 100%;
  max-width: 500px;
  height: 90dvh;
  margin: 0 auto;
  background-color: white;
  border: var(--border-primary);

  &:focus-visible {
    outline: 2px solid #1677ff;
    outline-offset: 2px;
  }
`;

const MenuItem = styled.button`
  padding: 8px 16px;
  color: #fff;
  cursor: pointer;
  background-color: #3498db;
  border: none;

  &:focus-visible {
    outline: 2px solid #1677ff;
    outline-offset: -2px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
