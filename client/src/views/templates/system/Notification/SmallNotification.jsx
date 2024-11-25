import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { selectAppMode, toggleMode } from '../../../../features/appModes/appModeSlice';
import { addNotification } from '../../../../features/notification/NotificationSlice';
import { Button } from '../Button/Button';

// Este es el componente principal que renderizará el componente Alert
export const SmallNotification = () => {
  const selectMode = useSelector(selectAppMode)
  const message = 'Modo Prueba.';
  const dispatch = useDispatch()
  const handleModeApp = () => {
    dispatch(toggleMode())
    dispatch(addNotification({title: 'Info', message: `Modo ${selectAppMode === false ? 'pruebas' : 'producción'}`, type: 'info'}))
  }
  return (
    <Container isOpen={selectMode ? true : false}>
      <Title>
        {message}
      </Title>
      <Button 
      title={'Desactivar'}
      bgcolor={'warning'}
      borderRadius='normal'
      onClick={handleModeApp}
       />
    </Container>
  );
};

const Container = styled.div`
  position: fixed;
  top: 0.2em;
  left: 50%;
  border-radius: var(--border-radius);
  z-index: 9999;
  transform: translateX(-50%);
  padding: 2px 2px  2px 10px;
  border: 2px solid orange;
  background-color: white;
  color: black;
  font-size: 14px;
  display: flex;
  gap: 1em;
  align-items: center;
  transition: transform 400ms ease-in-out;
  ${(props) => { 
    switch (props.isOpen) {
      case true:
        return`
        transform: translateY(calc(-100% - 0.4em)) translateX(-50%); 
        `
      default:
        break;
    }
    
    }}
`;
const Title = styled.div`
  font-weight: bold;
  color: var(--Gray8);
  letter-spacing: 1px;
`;