import React, { useState, type ReactNode } from 'react';
import styled from 'styled-components';

const ModalWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: rgb(0 0 0 / 30%);
`;

const ModalContent = styled.div`
  width: 80%;
  max-width: 600px;
  padding: 1rem;
  background-color: white;
  border-radius: 0.5rem;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
`;

const ModalCloseButton = styled.button`
  font-size: 1.5rem;
  cursor: pointer;
  background-color: transparent;
  border: none;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
`;

const ModalButton = styled.button`
  padding: 0.5rem 1rem;
  color: white;
  cursor: pointer;
  background-color: #07f;
  border: none;
  border-radius: 0.5rem;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: #06c;
  }
`;

interface ModalToggleButtonProps {
  $active?: boolean;
}

const ModalToggleButton = styled.button<ModalToggleButtonProps>`
  background-color: transparent;
  border: none;
  cursor: pointer;
  text-transform: uppercase;
  font-weight: bold;
  transition: color 0.2s ease-in-out;

  &:hover {
    color: #07f;
  }

  &:focus {
    outline: none;
  }

  ${(props) =>
    props.$active &&
    `
      color: #0077ff;
    `}
`;

interface AddProductAndServicesModalProps {
  title: ReactNode;
  children?: ReactNode;
  onClose: () => void;
  onSave: () => void;
}

export const AddProductAndServicesModal = ({
  title,
  children,
  onClose,
  onSave,
}: AddProductAndServicesModalProps) => {
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
          <ModalToggleButton
            $active={isProductSelected}
            onClick={handleProductToggle}
          >
            Producto
          </ModalToggleButton>
          <ModalToggleButton
            $active={!isProductSelected}
            onClick={handleServiceToggle}
          >
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
