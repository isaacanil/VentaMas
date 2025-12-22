import { faCompress, faExpand } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useDispatch, useSelector } from 'react-redux';
import { useMatch } from 'react-router-dom';
import styled from 'styled-components';

import { icons } from '../../../../../constants/icons/icons';
import { selectUser } from '../../../../../features/auth/userSlice';
import {
  selectFullScreen,
  toggleFullScreen,
} from '../../../../../features/setting/settingSlice';
import { useAppNavigation } from '../../../../../hooks/useAppNavigation';
import ROUTES_NAME from '@/router/routes/routesName';
import { InventoryFilterAndSort } from '../../../../pages/Inventario/pages/ItemsManager/components/InvetoryFilterAndSort/InventoryFilterAndSort';
import { ButtonIconMenu } from '../../../system/Button/ButtonIconMenu';

export const VentaMenuToolbar = ({ side = 'left' }) => {
  const navigation = useAppNavigation();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const FullScreen = useSelector(selectFullScreen);
  const { SALES } = ROUTES_NAME.SALES_TERM;
  const matchWithVenta = useMatch(SALES);

  const handleFullScreenFN = () => dispatch(toggleFullScreen());

  const handleSettings = () => {
    navigation.setting();
  };

  return (
    matchWithVenta && (
      <Container>
        {side === 'right' && (
          <Group>
            <ButtonIconMenu
              tooltipDescription={
                FullScreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'
              }
              icon={
                FullScreen ? (
                  <FontAwesomeIcon icon={faCompress} />
                ) : (
                  <FontAwesomeIcon icon={faExpand} />
                )
              }
              onClick={() => handleFullScreenFN()}
            />
            {user?.role !== 'cashier' && (
              <ButtonIconMenu
                icon={icons.operationModes.setting}
                onClick={handleSettings}
                tooltipDescription={'Configuración'}
              />
            )}
            {/* <DropdownMenu
                                title={icons.operationModes.setting}
                                options={options}
                                width={'icon32'}
                                borderRadius='normal'
                                
                            /> */}
          </Group>
        )}
        {side === 'left' && (
          <InventoryFilterAndSort
            tooltip={'Filtrar y Ordenar'}
            tooltipDescription={'Filtrar y Ordenar'}
            tooltipPlacement={'bottom-start'}
            contextKey="sales"
          />
        )}
      </Container>
    )
  );
};
const Container = styled.div``;
const Group = styled.div`
  display: flex;
  gap: 0.4em;
  align-items: center;
`;
