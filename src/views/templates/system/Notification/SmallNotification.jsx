import { notification } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectAppMode, toggleMode } from '../../../../features/appModes/appModeSlice';
import { Button } from '../Button/Button';

export const SmallNotification = () => {
  
  const selectMode = useSelector(selectAppMode);
  const message = 'Modo Prueba.';
  const dispatch = useDispatch();
  const handleModeApp = () => {
    dispatch(toggleMode());
    // El mensaje debe indicar A QUÉ modo se está cambiando (después del toggle)
    notification.info({
      message: 'Info',
      description: `Modo ${selectMode === true ? 'producción' : 'pruebas'} activado`,
    });
  }
  
  return (
    <Container isOpen={selectMode ? true : false}>
      <Title>
        {message}
      </Title>      <Button 
      title={selectMode ? 'Desactivar' : 'Activar'}
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
  align-items: center;  transition: transform 400ms ease-in-out;
  ${(props) => { 
    switch (props.isOpen) {
      case true:
        return`
        transform: translateY(0) translateX(-50%); 
        `
      default:
        return`
        transform: translateY(calc(-100% - 0.4em)) translateX(-50%); 
        `
    }
    }}
`;
const Title = styled.div`
  font-weight: bold;
  color: var(--Gray8);
  letter-spacing: 1px;
`;