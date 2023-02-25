import React from 'react';
import styled from 'styled-components';

const ModalContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  
`;

const ModalWrapper = styled.div`
  background-color: white;

  border-radius: 8px;
  width: 600px;
  height: 600px;
  overflow: hidden;
  position: relative;
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
  margin-left: 10px;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #f5f5f5;
  }
`;

const Modal = ({ title, onClose, onAccept, children }) => {
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