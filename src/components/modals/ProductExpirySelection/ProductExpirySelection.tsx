// @ts-nocheck
import { Modal, Button, Spin } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  clearProductExpirySelector,
  selectModalOpen,
  selectProductId,
  setModalOpen,
} from '@/features/warehouse/productExpirySelectionSlice';

import InventoryCard from './components/InventoryCard';
import { useGetAllInventoryData } from './fbFetchAllInventoryData';

const StyledPageContainer = styled.div`
  display: grid;
  gap: 1rem;
  min-height: 75vh;
  padding: 20px;
  background: linear-gradient(to bottom right, #f0f2f5, #c3d8ff);
`;

const StyledCardsGroup = styled.div`
  display: grid;

  h3 {
    font-size: 1rem;
    font-weight: 700;
    color: #1a1a1a;
  }
`;

const StyledCardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
`;

const ErrorBanner = styled.div`
  padding: 12px;
  margin-top: 1rem;
  color: #a8071a;
  background: #fff1f0;
  border: 1px solid #ffa39e;
  border-radius: 8px;
`;

const groupInventoryByWarehouse = (inventoryItems) => {
  return inventoryItems.reduce((acc, item) => {
    const warehouse = item.warehouse;
    if (!acc[warehouse]) {
      acc[warehouse] = [];
    }
    acc[warehouse].push(item);
    return acc;
  }, {});
};

const ProductExpirySelection = () => {
  const dispatch = useDispatch();
  const productId = useSelector(selectProductId);
  const isOpen = useSelector(selectModalOpen);
  // const inventory = useSelector(selectFilteredInventory);
  // const [items, setItems] = useState([]);
  const { loading, data: items, error } = useGetAllInventoryData(productId);

  const handleClose = () => {
    dispatch(setModalOpen(false));
    dispatch(clearProductExpirySelector());
  };

  const groupedItems = groupInventoryByWarehouse(items ?? []);

  return (
    <Modal
      title="Seleccionar Ubicación de Inventario"
      open={isOpen}
      width={1000}
      onCancel={handleClose}
      style={{ top: 10 }}
      footer={[
        <Button key="close" onClick={handleClose} type="primary">
          Cerrar
        </Button>,
      ]}
    >
      {loading ? (
        <Spin tip="Cargando..." size="large">
          <div style={{ height: '400px' }}></div>
        </Spin>
      ) : error ? (
        <ErrorBanner>Error al cargar inventario: {error}</ErrorBanner>
      ) : (
        <StyledPageContainer>
          {Object.entries(groupedItems).map(([warehouse, warehouseItems]) => (
            <StyledCardsGroup key={warehouse}>
              <h3>{warehouse}</h3>
              <StyledCardGrid>
                {warehouseItems.map((item) => (
                  <InventoryCard key={item.productStockId} item={item} />
                ))}
              </StyledCardGrid>
            </StyledCardsGroup>
          ))}
        </StyledPageContainer>
      )}
    </Modal>
  );
};

export default ProductExpirySelection;
