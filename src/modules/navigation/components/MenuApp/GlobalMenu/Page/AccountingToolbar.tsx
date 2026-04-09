import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import ROUTES_NAME from '@/router/routes/routesName';
import { ButtonIconMenu } from '@/components/ui/Button/ButtonIconMenu';
import type { ToolbarComponentProps } from '@/modules/navigation/components/MenuApp/GlobalMenu/types';

const { GENERAL_CONFIG_ACCOUNTING } = ROUTES_NAME.SETTING_TERM;

export const AccountingToolbar = ({ side = 'left' }: ToolbarComponentProps) => {
  const navigate = useNavigate();

  const handleSettings = useCallback(() => {
    navigate(GENERAL_CONFIG_ACCOUNTING);
  }, [navigate]);

  if (side !== 'right') {
    return null;
  }

  return (
    <Container>
      <ButtonIconMenu
        icon={icons.operationModes.setting}
        onClick={handleSettings}
        tooltipDescription="Configuración contable"
      />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  gap: 0.4em;
  align-items: center;
`;
