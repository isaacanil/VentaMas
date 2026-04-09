import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { useDefaultWarehouse } from '@/firebase/warehouse/warehouseService';
import ROUTES_PATH from '@/router/routes/routesName';

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

const Tab = styled.button<{ $active: boolean }>`
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 12px 16px;
  font-size: 14px;
  color: ${(props) => (props.$active ? '#1976d2' : '#666')};
  white-space: nowrap;
  cursor: pointer;
  background: none;
  border: none;
  border-bottom: 2px solid
    ${(props) => (props.$active ? '#1976d2' : 'transparent')};
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

  const handleChange = (newValue: number) => {
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

  const activeValue = useMemo(() => {
    const path = location.pathname;
    if (path === `${WAREHOUSES}/products-stock`) return 1;
    if (path.startsWith(`${WAREHOUSES}/warehouse/`)) return 0;
    if (path.includes('/backorders')) return 2;
    if (path.includes('/purchases')) return 3;
    if (path.includes('/orders')) return 4;
    return 0;
  }, [location.pathname, WAREHOUSES]);

  useEffect(() => {
    if (
      location.pathname === WAREHOUSES &&
      !loadingDefault &&
      defaultWarehouse
    ) {
      navigate(`${WAREHOUSES}/warehouse/${defaultWarehouse.id}`);
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
        <Tab $active={activeValue === 0} onClick={() => handleChange(0)}>
          Almacenes
        </Tab>
        <Tab $active={activeValue === 1} onClick={() => handleChange(1)}>
          Stock
        </Tab>
        <Tab $active={activeValue === 2} onClick={() => handleChange(2)}>
          Backorders
        </Tab>
        <Tab $active={activeValue === 3} onClick={() => handleChange(3)}>
          Compras
          <ExternalArrow>
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
          </ExternalArrow>
        </Tab>
        <Tab $active={activeValue === 4} onClick={() => handleChange(4)}>
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
