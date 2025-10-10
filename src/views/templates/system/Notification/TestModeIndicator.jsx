import { faFlask, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { notification } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import styled, { keyframes } from 'styled-components';

import { selectAppMode, toggleMode } from '../../../../features/appModes/appModeSlice';

export const TestModeIndicator = () => {
  const isTestMode = useSelector(selectAppMode);
  const dispatch = useDispatch();

  const handleToggleMode = () => {
    dispatch(toggleMode());
    
    // Notificación mejorada con más contexto
    notification.success({
      message: isTestMode ? 'Modo Producción' : 'Modo Prueba',
      description: isTestMode 
        ? 'Las facturas ahora se guardarán en la base de datos.'
        : 'Las facturas se procesarán como prueba sin afectar los datos.',
      duration: 4,
    });
  };

  if (!isTestMode) return null;

  return (
    <IndicatorPill>
      <IconContainer>
        <FontAwesomeIcon icon={faFlask} />
      </IconContainer>
      
      <ContentSection>
        <Title>Modo de Prueba</Title>
        <Subtitle>Las facturas no se guardan</Subtitle>
      </ContentSection>      
      <ActionButton onClick={handleToggleMode} title="Desactivar modo de prueba">
        <FontAwesomeIcon icon={faTimes} />
      </ActionButton>
    </IndicatorPill>
  );
};

// Animaciones
const pulseGlow = keyframes`
  0% { box-shadow: 0 0 20px rgba(255, 193, 7, 0.4); }
  50% { box-shadow: 0 0 80px rgba(255, 193, 7, 0.6), 0 0 40px rgba(255, 193, 7, 0.3); }
  100% { box-shadow: 0 0 20px rgba(255, 193, 7, 0.4); }
`;

const slideDown = keyframes`
  from {
    transform: translate(-50%, -100%);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
`;

// Componentes estilizados
const IndicatorPill = styled.div`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  
  display: flex;
  align-items: center;
  gap: 12px;
  
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  border: 2px solid #f39c12;
  border-radius: 50px;
  padding: 8px 16px 8px 8px;
  
  animation: ${slideDown} 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55),
             ${pulseGlow} 2s ease-in-out infinite;
  
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(255, 193, 7, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateX(-50%) scale(1.01);
    box-shadow: 
      0 12px 40px rgba(0, 0, 0, 0.4),
      0 0 30px rgba(255, 193, 7, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }
`;

const IconContainer = styled.div`
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
  
  /* animation: ${pulseGlow} 2s ease-in-out infinite; */
`;

const ContentSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 120px;
`;

const Title = styled.span`
  color: #ecf0f1;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.span`
  color: #bdc3c7;
  font-size: 11px;
  font-weight: 400;
  opacity: 0.9;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`;

const ActionButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background-color: #292929;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #585858;
  }
`;
