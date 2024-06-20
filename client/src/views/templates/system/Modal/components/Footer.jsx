import React from 'react'
import styled from 'styled-components';

export const Footer = ({onCancel, onOk, okText, cancelText}) => {
    return (
        <Container>
            <button onClick={onCancel}>{cancelText || 'Cancelar'}</button>
            <button onClick={onOk}>{okText || 'Aceptar'}</button>
        </Container>
    )
}

const Container = styled.div`
  padding: 10px;
  border-top: 1px solid #ddd;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;
