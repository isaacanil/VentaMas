import React, { useState } from 'react';
import styled from 'styled-components';

import { icons } from '../../../../constants/icons/icons';
import { Button } from '../Button/Button';

import Modal from './Modal';

const Menu = ({ isOpen, onClose, options }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  const openModal = (option) => {
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
        <MenuContainer>
          <Header>
            <h1>Configuraciones</h1>
            <Button title={icons.operationModes.close} onClick={onClose} />
          </Header>
          {}
          {options?.map((option) => (
            <MenuItem key={option.id} onClick={() => openModal(option)}>
              {option.label}
            </MenuItem>
          ))}
          {isModalOpen && (
            <Modal content={selectedOption.component} closeModal={closeModal} />
          )}
        </MenuContainer>
      </Backdrop>
    )
  );
};

export default Menu;
const Backdrop = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1000000000000000000;
  width: 100%;
  height: 100%;
  background-color: rgb(0 0 0 / 50%);
`;

const MenuContainer = styled.div`
  position: relative;
  display: grid;
  align-content: start;
  width: 100%;
  max-width: 500px;
  height: 90vh;
  margin: 0 auto;
  background-color: white;
  border: var(--border-primary);
`;

const MenuItem = styled.button`
  padding: 8px 16px;
  color: #fff;
  cursor: pointer;
  background-color: #3498db;
  border: none;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
