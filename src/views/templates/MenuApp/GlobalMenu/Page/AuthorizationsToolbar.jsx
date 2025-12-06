import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { icons } from '../../../../../constants/icons/icons';
import ROUTES_NAME from '../../../../../routes/routesName';
import { ButtonIconMenu } from '../../../system/Button/ButtonIconMenu';

const { SETTING_TERM } = ROUTES_NAME;
const { GENERAL_CONFIG_AUTHORIZATION } = SETTING_TERM;

export const AuthorizationsToolbar = ({ side }) => {
  const navigate = useNavigate();

  const handleSettings = useCallback(() => {
    navigate(GENERAL_CONFIG_AUTHORIZATION);
  }, [navigate]);

  if (side !== 'right') {
    return null;
  }

  return (
    <Container>
      <ButtonIconMenu
        icon={icons.operationModes.setting}
        onClick={handleSettings}
        tooltipDescription={'Configuración de Autorizaciones'}
      />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  gap: 0.4em;
  align-items: center;
`;
