import { Button } from 'antd';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { icons } from '../../../../../constants/icons/icons';
import { toggleSignUpUser } from '../../../../../features/modals/modalSlice';

const GeneralConfigToolbar = ({ side = 'left' }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const path = location.pathname;

  // Objeto de configuración que mapea rutas a contenidos de toolbar
  const toolbarConfig = {
    // Usuarios
    'users': {
      leftSide: () => null,
      rightSide: () => (
        <Button 
          onClick={() => dispatch(toggleSignUpUser({isOpen: true}))}
          icon={icons.operationModes.add}
        >
          Usuario
        </Button>
      )
    },
    // Billing (facturación)
    'billing': {
      leftSide: () => null,
      rightSide: () => null
    },
    // Business info (datos de la empresa)
    'business': {
      leftSide: () => null,
      rightSide: () => null
    },
    // Tax receipt (comprobantes fiscales)
    'tax-receipt': {
      leftSide: () => null,
      rightSide: () => null
    },
    // App info
    'app-info': {
      leftSide: () => null,
      rightSide: () => null
    }
  };

  // Determinar qué sección está activa
  const getActiveSection = () => {
    if (path.includes('users')) return 'users';
    if (path.includes('business')) return 'business';
    if (path.includes('tax-receipt')) return 'tax-receipt';
    if (path.includes('app-info')) return 'app-info';
    return 'billing'; // Por defecto
  };

  const activeSection = getActiveSection();
  
  // Renderizar el contenido apropiado según el lado y la sección activa
  const renderContent = () => {
    const config = toolbarConfig[activeSection];
    if (!config) return null;

    return side === 'left' ? config.leftSide() : config.rightSide();
  };

  return (
    <Container>
      {renderContent()}
    </Container>
  );
};

export default GeneralConfigToolbar;

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;