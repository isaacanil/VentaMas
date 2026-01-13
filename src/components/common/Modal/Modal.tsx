import React from 'react';
import styled from 'styled-components';

interface ModalProps {
  title?: React.ReactNode;
  onClose?: () => void;
  onAccept?: () => void;
  children?: React.ReactNode;
}

const ModalContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: rgb(0 0 0 / 50%);
`;

const ModalWrapper = styled.div`
  position: relative;
  width: 600px;
  height: 600px;
  overflow: hidden;
  background-color: white;
  border-radius: 8px;
`;

const ModalHeader = styled.h2`
  font-size: 24px;
  font-weight: 600;
`;

const ModalContent = styled.div`
  margin-bottom: 20px;
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  height: 400px;
`;

const ModalButton = styled.button`
  padding: 10px 20px;
  margin-left: 10px;
  cursor: pointer;
  border: none;
  border-radius: 4px;

  &:hover {
    background-color: #f5f5f5;
  }
`;

const Modal = ({ title, onClose, onAccept, children }: ModalProps) => {
  return (
    <ModalContainer>
      <ModalWrapper>
        <ModalHeader>{title}</ModalHeader>
        <ModalContent>{children}</ModalContent>
        <ModalButtons>
          <ModalButton onClick={onClose}>Cancelar</ModalButton>
          <ModalButton onClick={onAccept}>Aceptar</ModalButton>
        </ModalButtons>
      </ModalWrapper>
    </ModalContainer>
  );
};

export default Modal;
