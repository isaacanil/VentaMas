import React from 'react';
import styled from 'styled-components';

const Modal = ({ selectedConfig, content, closeModal }) => {
    const renderConfig = () => {
        // Aquí podrías tener diferentes lógicas para renderizar las configuraciones según selectedConfig
        if (selectedConfig === 'config1') {
            return <div>Configuración 1 para la tabla</div>;
        } else if (selectedConfig === 'config2') {
            return <div>Configuración 2 para la tabla</div>;
        }
        // Agregar más casos según las configuraciones que necesites

        return <div>Configuración no encontrada</div>;
    };

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