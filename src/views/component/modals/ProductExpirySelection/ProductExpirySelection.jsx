import { Modal, Button, Spin } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  clearProductExpirySelector,
  selectModalOpen,
  selectProductId,
  setModalOpen,
} from '../../../../features/warehouse/productExpirySelectionSlice';

import InventoryCard from './components/InventoryCard';
import { useGetAllInventoryData } from './fbFetchAllInventoryData';

const StyledPageContainer = styled.div`
  padding: 20px;
  background: linear-gradient(to bottom right, #f0f2f5, #c3d8ff);
  min-height: 75vh;
  display: grid;
  gap: 1rem;
`;

const StyledCardsGroup = styled.div`
  display: grid;
  h3 {
    color: #1a1a1a;
    font-size: 1rem;
    font-weight: 700;
  }
`;

const StyledCardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
`;

const ErrorBanner = styled.div`
  margin-top: 1rem;
  padding: 12px;
  border-radius: 8px;
  background: #fff1f0;
  color: #a8071a;
  border: 1px solid #ffa39e;
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
      <Spin spinning={loading} tip="Cargando..." size="large">
        {loading && <div style={{ height: '400px' }}></div>}
      </Spin>
      {!loading && error && (
        <ErrorBanner>Error al cargar inventario: {error}</ErrorBanner>
      )}
      {!loading && (
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
