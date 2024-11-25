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
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background-color: #fff;
  height: 100%;
    width: 100%;
  border-radius: 4px;
  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.2);
`;