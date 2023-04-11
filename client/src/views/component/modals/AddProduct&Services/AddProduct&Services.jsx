import React, { useState } from 'react';
import styled from 'styled-components';

const ModalWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.3);
`;

const ModalContent = styled.div`
  width: 80%;
  max-width: 600px;
  background-color: white;
  padding: 1rem;
  border-radius: 0.5rem;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
`;

const ModalCloseButton = styled.button`
  background-color: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
`;

const ModalButton = styled.button`
  background-color: #0077ff;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: #0066cc;
  }
`;

const ModalToggleButton = styled.button`
  background-color: transparent;
  border: none;
  cursor: pointer;
  text-transform: uppercase;
  font-weight: bold;
  transition: color 0.2s ease-in-out;

  &:hover {
    color: #0077ff;
  }

  &:focus {
    outline: none;
  }

  ${({ active }) =>
    active &&
    `
      color: #0077ff;
    `}
`;

export const AddProductAndServicesModal = ({ title, children, onClose, onSave }) => {
  const [isProductSelected, setIsProductSelected] = useState(true);

  const handleProductToggle = () => {
    setIsProductSelected(true);
  };

  const handleServiceToggle = () => {
    setIsProductSelected(false);
  };

  return (
    <ModalWrapper>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <ModalCloseButton onClick={onClose}>X</ModalCloseButton>
        </ModalHeader>
        <div>
          <ModalToggleButton active={isProductSelected} onClick={handleProductToggle}>
            Producto
          </ModalToggleButton>
          <ModalToggleButton active={!isProductSelected} onClick={handleServiceToggle}>
            Servicio
          </ModalToggleButton>
        </div>
        <div>{children}</div>
        <ModalFooter>
          <ModalButton onClick={onSave}>Guardar</ModalButton>
        </ModalFooter>
      </ModalContent>
    </ModalWrapper>
  );
};


