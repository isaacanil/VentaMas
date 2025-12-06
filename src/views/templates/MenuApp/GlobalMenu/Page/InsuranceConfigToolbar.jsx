import React, { Fragment } from 'react';
import { useDispatch } from 'react-redux';
import { useMatch } from 'react-router-dom';
import styled from 'styled-components';

import { icons } from '../../../../../constants/icons/icons';
import { openInsuranceConfigModal } from '../../../../../features/insurance/insuranceConfigModalSlice';
import ROUTES_NAME from '../../../../../routes/routesName';
import { Button } from '../../../system/Button/Button';

export const InsuranceConfigToolbar = ({ side = 'left' }) => {
  const dispatch = useDispatch();
  const { INSURANCE_CONFIG } = ROUTES_NAME.INSURANCE_TERM;
  const matchInsuranceConfig = useMatch(INSURANCE_CONFIG);

  const handleCreateNew = () => {
    dispatch(openInsuranceConfigModal(null));
  };

  return (
    matchInsuranceConfig && (
      <Fragment>
        <Container>
          {side === 'right' && (
            <Group>
              <Button
                tooltipDescription={'Agregar almacén'}
                tooltipPlacement={'bottom-end'}
                startIcon={icons.operationModes.add}
                borderRadius="normal"
                title={'Seguro'}
                onClick={handleCreateNew}
              />
            </Group>
          )}
        </Container>
      </Fragment>
    )
  );
};
const Container = styled.div``;
const Group = styled.div`
  display: flex;
  gap: 0.4em;
  align-items: center;
`;
