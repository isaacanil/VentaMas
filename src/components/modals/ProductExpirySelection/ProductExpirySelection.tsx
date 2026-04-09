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
import {
  useGetAllInventoryData,
  type InventoryDisplayItem,
} from './fbFetchAllInventoryData';

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

type GroupedInventory = Record<string, InventoryDisplayItem[]>;

const groupInventoryByWarehouse = (
  inventoryItems: InventoryDisplayItem[],
): GroupedInventory => {
  return inventoryItems.reduce<GroupedInventory>((acc, item) => {
    const warehouse = item.warehouse;
    if (!acc[warehouse]) {
      acc[warehouse] = [];
    }
    acc[warehouse].push(item);
    return acc;
  }, {});
};

type InventoryWithLegacyId = InventoryDisplayItem & {
  productStockId?: unknown;
};

const hasLegacyProductStockId = (
  item: InventoryDisplayItem,
): item is InventoryWithLegacyId => 'productStockId' in item;

const getInventoryItemKey = (item: InventoryDisplayItem): string => {
  if (hasLegacyProductStockId(item)) {
    const legacyId = item.productStockId;
    if (typeof legacyId === 'string' && legacyId.trim()) {
      return legacyId;
    }
  }
  return item.productStock.id;
};

const getErrorMessage = (err: unknown): string => {
  if (!err) return '';
  if (err instanceof Error) return err.toString();
  return String(err);
};

const ProductExpirySelection = () => {
  const dispatch = useDispatch();
  const productIdRaw = useSelector(selectProductId) as unknown;
  const productId = typeof productIdRaw === 'string' ? productIdRaw : null;
  const isOpenRaw = useSelector(selectModalOpen) as unknown;
  const isOpen =
    typeof isOpenRaw === 'boolean' ? isOpenRaw : Boolean(isOpenRaw);
  // const inventory = useSelector(selectFilteredInventory);
  // const [items, setItems] = useState([]);
  const { loading, data: items, error } = useGetAllInventoryData(productId);

  const handleClose = () => {
    dispatch(setModalOpen(false));
    dispatch(clearProductExpirySelector());
  };

  const groupedItems = groupInventoryByWarehouse(items);

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
        <ErrorBanner>
          Error al cargar inventario: {getErrorMessage(error)}
        </ErrorBanner>
      ) : (
        <StyledPageContainer>
          {Object.entries(groupedItems).map(([warehouse, warehouseItems]) => (
            <StyledCardsGroup key={warehouse}>
              <h3>{warehouse}</h3>
              <StyledCardGrid>
                {warehouseItems.map((item) => (
                  <InventoryCard key={getInventoryItemKey(item)} item={item} />
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
