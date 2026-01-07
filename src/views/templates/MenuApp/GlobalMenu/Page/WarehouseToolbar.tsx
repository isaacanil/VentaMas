// @ts-nocheck
import { PlusOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import React, { Fragment, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { selectUser } from '@/features/auth/userSlice';
import { openWarehouseForm } from '@/features/warehouse/warehouseModalSlice';
import ROUTES_NAME from '@/router/routes/routesName';
import { ButtonIconMenu } from '@/views/templates/system/Button/ButtonIconMenu';

export const WarehouseToolbar = ({ side = 'left' }) => {
  const [_isOpen, _setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useSelector(selectUser);
  const { WAREHOUSES, WAREHOUSE, SHELF, ROW, SEGMENT } =
    ROUTES_NAME.INVENTORY_TERM;

  const paths = [WAREHOUSES, WAREHOUSE, SHELF, ROW, SEGMENT];

  // Función para comparar rutas dinámicas
  const isMatchingPath = (targetPath) => {
    // Convertir la ruta dinámica a un patrón regex
    const dynamicPathRegex = new RegExp(
      `^${targetPath.replace(/:\w+/g, '[^/]+')}$`,
    );
    return dynamicPathRegex.test(pathname);
  };

  // Verificar si la ruta actual coincide con alguna de las rutas
  const matchWithWarehouses = paths.some(isMatchingPath);
  const handleAddWarehouse = () => {
    dispatch(openWarehouseForm());
  };
  const handleOpenInventorySettings = () => {
    navigate(ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_INVENTORY);
  };
  return (
    matchWithWarehouses && (
      <Fragment>
        <Container>
          {side === 'right' && (
            <Group>
              <Tooltip title="Agregar almacén" placement="bottom">
                <Button icon={<PlusOutlined />} onClick={handleAddWarehouse}>
                  Almacén
                </Button>
              </Tooltip>
              {user?.role !== 'cashier' && (
                <ButtonIconMenu
                  icon={icons.operationModes.setting}
                  onClick={handleOpenInventorySettings}
                  tooltipDescription={'Configuración de inventario'}
                />
              )}
            </Group>
          )}
        </Container>
        {/* {_isOpen && (
                    <WarehouseForm
                        isOpen={_isOpen}
                        onClose={() => _setIsOpen(false)}
                        
                    />
                )} */}
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
