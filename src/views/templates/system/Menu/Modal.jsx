import React from 'react';
import styled from 'styled-components';

const Modal = ({ content, closeModal }) => {
  return (
    <ModalContainer>
      <ModalContent>
        {content}
        <button onClick={closeModal}>Cerrar</button>
      </ModalContent>
    </ModalContainer>
  );
};

export default Modal;

// Modal.js

const ModalContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`;

const ModalContent = styled.div`
  width: 100%;
  height: 100%;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgb(0 0 0 / 20%);
`;
