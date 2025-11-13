import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { useDefaultWarehouse } from '../../../../../../../firebase/warehouse/warehouseService';
import ROUTES_PATH from '../../../../../../../routes/routesName';

const MenuContainer = styled.div`
  margin-bottom: 0;
  border-bottom: 1px solid #e0e0e0;
`;

const TabList = styled.div`
  display: flex;
  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }
`;

const Tab = styled.button`
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 12px 16px;
  font-size: 14px;
  color: ${(props) => (props.active ? '#1976d2' : '#666')};
  white-space: nowrap;
  cursor: pointer;
  background: none;
  border: none;
  border-bottom: 2px solid
    ${(props) => (props.active ? '#1976d2' : 'transparent')};
  transition: all 0.3s ease;

  &:hover {
    color: #1976d2;
  }
`;

const ExternalArrow = styled.span`
  margin-left: 2px;
  font-size: 12px;
  opacity: 0.7;
`;

const InventoryMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { defaultWarehouse, loading: loadingDefault } = useDefaultWarehouse();

  const { INVENTORY_TERM, PURCHASE_TERM, ORDER_TERM } = ROUTES_PATH;
  const { WAREHOUSES, PRODUCTS_STOCK } = INVENTORY_TERM;
  const { BACKORDERS, PURCHASES } = PURCHASE_TERM;
  const { ORDERS } = ORDER_TERM;

  const [value, setValue] = React.useState(0);

  const handleChange = (newValue) => {
    setValue(newValue);
    let selectedRoute;

    switch (newValue) {
      case 0: // Almacenes
        if (!loadingDefault && defaultWarehouse) {
          selectedRoute = `${WAREHOUSES}/warehouse/${defaultWarehouse.id}`;
        }
        break;
      case 1: // Stock
        selectedRoute = PRODUCTS_STOCK;
        break;
      case 2: // Backorders
        selectedRoute = BACKORDERS;
        break;
      case 3: // Compras
        selectedRoute = PURCHASES;
        break;
      case 4: // Pedidos
        selectedRoute = ORDERS;
        break;
      default:
        selectedRoute = WAREHOUSES; // Default to warehouses if no match
    }

    if (selectedRoute) {
      navigate(selectedRoute);
    }
  };

  React.useEffect(() => {
    const path = location.pathname;

    // Stock: /inventory/warehouses/products-stock
    if (path === `${WAREHOUSES}/products-stock`) {
      setValue(1);
    }
    // Almacenes: /inventory/warehouses/warehouse/[id] y niveles posteriores (shelf, row, segment)
    else if (path.startsWith(`${WAREHOUSES}/warehouse/`)) {
      setValue(0);
    }
    // Backorders: cualquier ruta con /backorders
    else if (path.includes('/backorders')) {
      setValue(2);
    }
    // Compras: cualquier ruta con /purchases
    else if (path.includes('/purchases')) {
      setValue(3);
    }
    // Pedidos: cualquier ruta con /orders
    else if (path.includes('/orders')) {
      setValue(4);
    }
    // Default: redirigir al almacén por defecto
    else if (path === WAREHOUSES) {
      setValue(0);
      if (!loadingDefault && defaultWarehouse) {
        navigate(`${WAREHOUSES}/warehouse/${defaultWarehouse.id}`);
      }
    }
  }, [
    location.pathname,
    loadingDefault,
    defaultWarehouse,
    navigate,
    WAREHOUSES,
  ]);

  return (
    <MenuContainer>
      <TabList>
        <Tab active={value === 0} onClick={() => handleChange(0)}>
          Almacenes
        </Tab>
        <Tab active={value === 1} onClick={() => handleChange(1)}>
          Stock
        </Tab>
        <Tab active={value === 2} onClick={() => handleChange(2)}>
          Backorders
        </Tab>
        <Tab active={value === 3} onClick={() => handleChange(3)}>
          Compras
          <ExternalArrow>
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
          </ExternalArrow>
        </Tab>
        <Tab active={value === 4} onClick={() => handleChange(4)}>
          Pedidos
          <ExternalArrow>
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
          </ExternalArrow>
        </Tab>
      </TabList>
    </MenuContainer>
  );
};

export default InventoryMenu;
