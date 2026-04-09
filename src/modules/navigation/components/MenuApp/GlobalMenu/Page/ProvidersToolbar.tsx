import { Button } from 'antd';
import { useDispatch } from 'react-redux';
import { useMatch } from 'react-router-dom';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { OPERATION_MODES } from '@/constants/modes';
import { toggleProviderModal } from '@/features/modals/modalSlice';
import routesName from '@/router/routes/routesName';
import type { ToolbarComponentProps } from '@/modules/navigation/components/MenuApp/GlobalMenu/types';

export const ProvidersToolbar = ({
  side = 'left',
}: ToolbarComponentProps) => {
  const { SUPPLIERS } = routesName.CONTACT_TERM;
  const matchWithProviders = useMatch(SUPPLIERS);
  const dispatch = useDispatch();

  const createMode = OPERATION_MODES.CREATE.id;
  const openModal = () =>
    dispatch(toggleProviderModal({ mode: createMode, data: null }));

  return matchWithProviders ? (
    <Container>
      {side === 'right' && (
        <Button
          type="primary"
          icon={icons.mathOperations.add}
          onClick={openModal}
        >
          Proveedor
        </Button>
      )}
    </Container>
  ) : null;
};

const Container = styled.div``;
