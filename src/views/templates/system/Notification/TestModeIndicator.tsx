import { faFlask, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { notification } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import styled, { keyframes } from 'styled-components';

import {
  selectAppMode,
  toggleMode,
} from '@/features/appModes/appModeSlice';

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
      <ActionButton
        onClick={handleToggleMode}
        title="Desactivar modo de prueba"
      >
        <FontAwesomeIcon icon={faTimes} />
      </ActionButton>
    </IndicatorPill>
  );
};

// Animaciones
const pulseGlow = keyframes`
  0% { box-shadow: 0 0 20px rgb(255 193 7 / 40%); }
  50% { box-shadow: 0 0 80px rgb(255 193 7 / 60%), 0 0 40px rgb(255 193 7 / 30%); }
  100% { box-shadow: 0 0 20px rgb(255 193 7 / 40%); }
`;

const slideDown = keyframes`
  from {
    opacity: 0;
    transform: translate(-50%, -100%);
  }

  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
`;

// Componentes estilizados
const IndicatorPill = styled.div`
  position: fixed;
  top: 20px;
  left: 50%;
  z-index: 10000;
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 8px 16px 8px 8px;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  border: 2px solid #f39c12;
  border-radius: 50px;
  box-shadow:
    0 8px 32px rgb(0 0 0 / 30%),
    0 0 20px rgb(255 193 7 / 40%),
    inset 0 1px 0 rgb(255 255 255 / 10%);
  transform: translateX(-50%);
  transition: all 0.3s ease;
  animation:
    ${slideDown} 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55),
    ${pulseGlow} 2s ease-in-out infinite;

  &:hover {
    box-shadow:
      0 12px 40px rgb(0 0 0 / 40%),
      0 0 30px rgb(255 193 7 / 60%),
      inset 0 1px 0 rgb(255 255 255 / 15%);
    transform: translateX(-50%) scale(1.01);
  }
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 16px;
  color: white;
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  border-radius: 50%;
  box-shadow: 0 4px 12px rgb(243 156 18 / 30%);

  /* animation: ${pulseGlow} 2s ease-in-out infinite; */
`;

const ContentSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 120px;
`;

const Title = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #ecf0f1;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgb(0 0 0 / 30%);
`;

const Subtitle = styled.span`
  font-size: 11px;
  font-weight: 400;
  color: #bdc3c7;
  text-shadow: 0 1px 2px rgb(0 0 0 / 20%);
  opacity: 0.9;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 12px;
  color: white;
  cursor: pointer;
  background-color: #292929;
  border: none;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    background-color: #585858;
  }
`;
