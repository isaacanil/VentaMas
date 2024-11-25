import React, { useState } from 'react';
import styled from 'styled-components';
import Modal from './Modal';
import { Button } from '../Button/Button';
import { icons } from '../../../../constants/icons/icons';

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
        isOpen &&
        <Backdrop>
            <MenuContainer>
                <Header>
                    <h1>Configuraciones</h1>
                    <Button title={icons.operationModes.close} onClick={onClose} />
                </Header>
                { }
                {options?.map(option => (
                    <MenuItem key={option.id} onClick={() => openModal(option)}>
                        {option.label}
                    </MenuItem>
                ))}
                {isModalOpen && (
                    <Modal content={selectedOption.component} closeModal={closeModal} />
                )}
            </MenuContainer>
        </Backdrop>
    );
};

export default Menu;
const Backdrop = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  z-index: 1000000000000000000;
  background-color: rgba(0, 0, 0, 0.5);

`;

const MenuContainer = styled.div`
  display: grid;
  height: 90vh;
  width: 100%;
  position: relative;
  max-width: 500px;
  border: var(--border-primary);
  background-color: white;
  align-content: start;
  margin: 0 auto;
`;

const MenuItem = styled.button`
  background-color: #3498db;
  color: #fff;
  border: none;
  padding: 8px 16px;
  cursor: pointer;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`