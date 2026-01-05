import {
  SearchOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  Modal,
  Button,
  Input,
  Empty,
  Spin,
  Checkbox,
  App,
} from 'antd';
import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';

import {
  addProduct,
  // SelectCartData, // 1. ELIMINADO: No se usaba
} from '@/features/cart/cartSlice';
import {
  DEFAULT_FILTER_CONTEXT,
  selectStockLocations,
} from '@/features/filterProduct/filterProductsSlice';
import {
  selectProductStockSimple,
  closeProductStockSimple,
} from '@/features/productStock/productStockSimpleSlice';
import { useListenProductsStock } from '@/firebase/warehouse/productStockService';
import { useLocationNames } from '@/hooks/useLocationNames';
import { toExpirationTimestamp } from '@/utils/inventory/dates';
import { normalizeLocationId } from '@/utils/inventory/locations';

const numberFormatter = new Intl.NumberFormat('es-DO');

const StyledWrapper = styled.div`
  .batch-select-button {
    padding: 10px 20px;
    font-weight: 500;
    color: white;
    background: linear-gradient(145deg, #2563eb, #1d4ed8);
    border: none;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 10%);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 6px 8px -1px rgb(0 0 0 / 15%);
      transform: translateY(-2px);
    }
  }
`;

const StyledModal = styled(Modal)`
  .ant-modal-content {
    overflow: hidden;
    border-radius: 16px;
  }

  .search-container {
    margin-bottom: 16px;
  }
`;

const BatchGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  max-height: 60vh;
  padding: 12px 0;
  overflow-y: auto;

    &::-webkit-scrollbar {
    width: 8px;
  }

    &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }

    &::-webkit-scrollbar-thumb {
    background: #94a3b8;
    border-radius: 4px;
  }
`;

const StatsBar = styled.div`
  display: inline-flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  font-size: 0.9rem;
  color: #475569;
`;

const StatLabel = styled.span`
  display: inline-flex;
  gap: 4px;
  align-items: baseline;
`;

const StatValue = styled.strong`
  font-size: 1rem;
  color: #0f172a;
`;

const LocationBadge = styled.span`
  display: inline-flex;
  align-items: center;
  margin: 0;

  font-size: 0.8rem;
  color: #334155;
  border-radius: 8px;
  max-width: 100%;
  white-space: normal;
  word-break: break-word;
  line-height: 1.3;
`;

const BatchCard = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
    gap: 10px;
    padding: 6px 10px;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  background: white;
  border: 2px solid
    ${({ selected, $expired, $disabled }) => {
    if ($disabled) return '#cbd5f5';
    if (selected && $expired) return '#dc2626';
    if (selected) return '#2563eb';
    return '#e2e8f0';
  }};
  border-radius: 12px;
  box-shadow: ${({ selected, $expired, $disabled }) => {
    if ($disabled) return 'none';
    if (selected && $expired) return '0 4px 12px rgba(220, 38, 38, 0.2)';
    if (selected) return '0 4px 12px rgba(37, 99, 235, 0.15)';
    return '0 2px 8px rgba(0, 0, 0, 0.05)';
  }};
  transition: all 0.2s ease;

  &:hover {
    box-shadow: ${({ $disabled }) =>
    $disabled ? 'none' : '0 6px 16px rgb(0 0 0 / 10%)'};
    transform: ${({ $disabled }) => ($disabled ? 'none' : 'translateY(-2px)')};
  }

  .batch-number {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: nowrap;
  }

  .header-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: nowrap;
    justify-content: flex-end;
    min-width: 0;
  }

  .quantity-chip {
    align-self: flex-start;
    padding: 2px 4px;
    font-weight: 600;
    color: #1d4ed8;
    background: #e8f0ff;
    border: 1px solid #dbeafe;
    border-radius: 8px;
    font-size: 0.85rem;
    white-space: nowrap;
  }

  .date-text {
    color: #475569;
    font-weight: 500;
    white-space: nowrap;
  }

  .info-row {
    display: flex;
    align-items: center;
    font-size: 0.86rem;
    color: #64748b;
    min-height: 24px;

    .icon {
      min-width: 16px;
      flex-shrink: 0;
      color: #94a3b8;
    }
  }

  .location-row {
    flex-wrap: nowrap;
    align-items: flex-start;
    min-width: 0;
    gap: 8px;

    .location-badge {
      flex: 1;
    }
  }

  .check-icon {
    font-size: 18px;
    color: #2563eb;
    opacity: ${(props) => (props.selected ? 1 : 0)};
    transform: ${(props) => (props.selected ? 'scale(1)' : 'scale(0.5)')};
    transition: all 0.2s ease;
  }
`;

export function ProductBatchModal() {
  const dispatch = useDispatch();
  const { notification, modal } = App.useApp();
  const { isOpen, productId, product } = useSelector(selectProductStockSimple);
  const [rawSelectedBatch, setRawSelectedBatch] = useState(null);
  const [searchText, setSearchText] = useState('');

  // 2. ELIMINADO: const { products } = useSelector(SelectCartData);

  const inventoryLocations = useSelector((state) =>
    selectStockLocations(state, DEFAULT_FILTER_CONTEXT),
  );
  const salesLocations = useSelector((state) =>
    selectStockLocations(state, 'sales'),
  );
  const selectedLocations = salesLocations?.length
    ? salesLocations
    : inventoryLocations;

  // Obtener datos de productStock en tiempo real
  const { data: productStocks, loading } = useListenProductsStock(productId);
  const { locationNames, fetchLocationName } = useLocationNames();
  const isStrictProduct = Boolean(product?.restrictSaleWithoutStock);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();


  const [hideExpired, setHideExpired] = useState(false);

  const sanitizedProductStocks = useMemo(() => {
    if (!Array.isArray(productStocks)) return [];
    if (!isStrictProduct) return productStocks;
    return productStocks.filter((stock) => (Number(stock?.quantity) || 0) > 0);
  }, [productStocks, isStrictProduct]);

  // 3. ESTRATEGIA: Función para cerrar y limpiar estado simultáneamente
  const handleCloseModal = () => {
    dispatch(closeProductStockSimple());
    setRawSelectedBatch(null);
    setSearchText('');
  };

  // 4. ELIMINADO: El useEffect que reseteaba el estado al abrirse (causante del error)
  // useEffect(() => { ... }, [isOpen]); 

  const filteredBySearch = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    const source = hideExpired
      ? sanitizedProductStocks.filter((stock) => {
        const exp = toExpirationTimestamp(stock?.expirationDate);
        return exp === null || exp >= todayTimestamp;
      })
      : sanitizedProductStocks;
    if (!term) return source;
    return source.filter(
      (stock) =>
        stock.batchNumberId?.toString().toLowerCase().includes(term) ||
        stock.location?.toLowerCase().includes(term),
    );
  }, [sanitizedProductStocks, searchText, hideExpired, todayTimestamp]);


  const inventorySummary = useMemo(() => {
    const locationSet = new Set();
    let totalQuantity = 0;
    filteredBySearch.forEach((stock) => {
      const loc = normalizeLocationId(stock?.location);
      if (loc) locationSet.add(loc);
      const qty = Number(stock?.quantity) || 0;
      if (Number.isFinite(qty)) totalQuantity += qty;
    });
    return {
      totalLocations: locationSet.size,
      totalQuantity,
    };
  }, [filteredBySearch]);

  const { prioritizedBatches, otherLocationBatches, hasLocationFilter } =
    useMemo(() => {
      const isInSelectedLocations = (locationId, selectedList) => {
        if (
          !locationId ||
          !Array.isArray(selectedList) ||
          selectedList.length === 0
        ) {
          return false;
        }
        return selectedList.some((rawSelected) => {
          const selectedId = normalizeLocationId(rawSelected);
          if (!selectedId) return false;
          if (locationId === selectedId) return true;
          return locationId.startsWith(`${selectedId}/`);
        });
      };

      const sanitizedSelected = (selectedLocations || [])
        .map(normalizeLocationId)
        .filter(Boolean);
      const filterActive = sanitizedSelected.length > 0;
      if (!filterActive) {
        return {
          prioritizedBatches: filteredBySearch,
          otherLocationBatches: [],
          hasLocationFilter: false,
        };
      }
      const preferred = [];
      const others = [];
      filteredBySearch.forEach((stock) => {
        const locationId = normalizeLocationId(stock?.location);
        if (isInSelectedLocations(locationId, sanitizedSelected)) {
          preferred.push(stock);
          return;
        }
        others.push(stock);
      });
      return {
        prioritizedBatches: preferred,
        otherLocationBatches: others,
        hasLocationFilter: true,
      };
    }, [filteredBySearch, selectedLocations]);

  useEffect(() => {
    const uniqueLocations = [
      ...new Set(
        filteredBySearch
          .map((stock) => normalizeLocationId(stock.location))
          .filter(Boolean),
      ),
    ];
    uniqueLocations.forEach((loc) => {
      if (!locationNames[loc]) {
        fetchLocationName(loc);
      }
    });
  }, [filteredBySearch, locationNames, fetchLocationName]);

  // Validar selectedBatch durante render: solo es válido si existe en la lista
  const selectedBatch = useMemo(() => {
    if (!rawSelectedBatch) return null;
    const exists = sanitizedProductStocks.some(
      (stock) => stock.id === rawSelectedBatch,
    );
    return exists ? rawSelectedBatch : null;
  }, [rawSelectedBatch, sanitizedProductStocks]);

  // Modificar la función formatLocation
  function formatLocation(locationId) {
    if (!locationId) return '';
    return locationNames[locationId] || 'Cargando...';
  }

  const commitSelection = (stockOrId) => {
    if (!stockOrId) return;
    const chosenStock =
      typeof stockOrId === 'object'
        ? stockOrId
        : sanitizedProductStocks.find((s) => s.id === stockOrId);

    if (!chosenStock) return;

    const batchInfo = {
      productStockId: chosenStock.id ?? null,
      batchId: chosenStock.batchId ?? null,
      batchNumber: chosenStock.batchNumberId ?? null,
      quantity: chosenStock.quantity ?? null,
      expirationDate: toExpirationTimestamp(chosenStock.expirationDate),
      locationId: chosenStock.location ?? null,
      locationName: chosenStock.location
        ? formatLocation(chosenStock.location)
        : null,
    };

    dispatch(
      addProduct({
        ...product,
        productStockId: batchInfo.productStockId,
        batchId: batchInfo.batchId,
        stock: chosenStock.quantity,
        batchInfo,
      }),
    );
    // 5. ACTUALIZADO: Usamos handleCloseModal para cerrar Y limpiar
    handleCloseModal();
  };

  const handleBatchToggle = (stock, isExpired) => {
    if (!stock) return;

    const numericQuantity = Number(stock.quantity) || 0;
    if (isStrictProduct && numericQuantity <= 0) {
      notification.warning({
        message: 'Este lote no tiene unidades disponibles. Selecciona otro lote con existencia.',
      });
      return;
    }

    const isCurrentlySelected = selectedBatch === stock.id;

    if (isCurrentlySelected) {
      setRawSelectedBatch(null);
      return;
    }

    if (isExpired) {
      modal.confirm({
        title: 'Producto vencido',
        icon: <ExclamationCircleOutlined style={{ color: '#dc2626' }} />,
        content: 'El lote seleccionado está vencido. ¿Desea agregarlo al carrito?',
        okText: 'Continuar',
        cancelText: 'Cancelar',
        onOk: () => commitSelection(stock),
      });
      return;
    }

    setRawSelectedBatch(stock.id);
  };

  const handleConfirm = () => {
    if (selectedBatch) {
      commitSelection(selectedBatch);
    }
  };

  return (
    <StyledWrapper>
      <StyledModal
        open={isOpen}
        onCancel={handleCloseModal} // 6. ACTUALIZADO: Limpia al cancelar/cerrar
        title="Seleccionar Ubicación del Producto"
        width={800}
        style={{ top: '10px' }}
        footer={
          <Button
            type="primary"
            onClick={handleConfirm}
            disabled={!selectedBatch}
          >
            Confirmar
          </Button>
        }
      >
        <div
          className="search-container"
          style={{ display: 'flex', gap: 8, alignItems: 'center' }}
        >
          <Input
            placeholder="Buscar por número de lote o ubicación..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ borderRadius: '8px' }}
          />
          <Checkbox
            checked={hideExpired}
            onChange={(e) => setHideExpired(e.target.checked)}
          >
            Ocultar vencidos
          </Checkbox>
        </div>

        {!loading && filteredBySearch.length > 0 && (
          <StatsBar>
            <StatLabel>
              Ubicaciones:
              <StatValue>
                {numberFormatter.format(inventorySummary.totalLocations)}
              </StatValue>
            </StatLabel>
            <StatLabel>
              Unidades:
              <StatValue>
                {numberFormatter.format(inventorySummary.totalQuantity)}
              </StatValue>
            </StatLabel>
          </StatsBar>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin />
          </div>
        ) : (
          <>
            {hasLocationFilter ? (
              <>
                {prioritizedBatches.length > 0 ? (
                  <Section>
                    <SectionTitle>
                      Disponibles en ubicaciones filtradas
                    </SectionTitle>
                    <BatchGrid>
                      {prioritizedBatches.map((stock) =>
                        renderBatchCard({
                          stock,
                          selectedBatch,
                          todayTimestamp,
                          handleBatchToggle,
                          toExpirationTimestamp,
                          formatLocation,
                          normalizeLocationId,
                          isStrictProduct,
                        }),
                      )}
                    </BatchGrid>
                  </Section>
                ) : (
                  <SectionNotice>
                    No se encontraron lotes en las ubicaciones seleccionadas.
                  </SectionNotice>
                )}

                {otherLocationBatches.length > 0 && (
                  <Section>
                    <SectionTitle>
                      Disponibles en otras ubicaciones
                    </SectionTitle>
                    <BatchGrid>
                      {otherLocationBatches.map((stock) =>
                        renderBatchCard({
                          stock,
                          selectedBatch,
                          todayTimestamp,
                          handleBatchToggle,
                          toExpirationTimestamp,
                          formatLocation,
                          normalizeLocationId,
                          isStrictProduct,
                        }),
                      )}
                    </BatchGrid>
                  </Section>
                )}

                {prioritizedBatches.length === 0 &&
                  otherLocationBatches.length === 0 && (
                    <Empty
                      description="No se encontraron lotes"
                      style={{ margin: '40px 0' }}
                    />
                  )}
              </>
            ) : filteredBySearch.length > 0 ? (
              <BatchGrid>
                {filteredBySearch.map((stock) =>
                  renderBatchCard({
                    stock,
                    selectedBatch,
                    todayTimestamp,
                    handleBatchToggle,
                    toExpirationTimestamp,
                    formatLocation,
                    normalizeLocationId,
                    isStrictProduct,
                  }),
                )}
              </BatchGrid>
            ) : (
              <Empty
                description={
                  isStrictProduct && productStocks.length > 0
                    ? 'No hay lotes con unidades disponibles'
                    : 'No se encontraron lotes registrados para este producto'
                }
                style={{ margin: '40px 0' }}
              />
            )}
          </>
        )}
      </StyledModal>
    </StyledWrapper>
  );
}

function renderBatchCard({
  stock,
  selectedBatch,
  todayTimestamp,
  handleBatchToggle,
  toExpirationTimestamp,
  formatLocation,
  normalizeLocationId,
  isStrictProduct,
}) {
  const expirationTimestamp = toExpirationTimestamp(stock.expirationDate);
  const isExpired =
    expirationTimestamp !== null && expirationTimestamp < todayTimestamp;
  const formattedExpiration = expirationTimestamp
    ? new Date(expirationTimestamp).toLocaleDateString()
    : null;
  const locationId = normalizeLocationId(stock.location);
  const numericQuantity = Number(stock.quantity) || 0;
  const isDisabled = isStrictProduct && numericQuantity <= 0;

  return (
    <BatchCard
      key={stock.id}
      selected={selectedBatch === stock.id}
      $expired={isExpired}
      $disabled={isDisabled}
      onClick={() => !isDisabled && handleBatchToggle(stock, isExpired)}
    >
      <div className="card-header">
        <div className="batch-number">
          Lote #{stock.batchNumberId}
          <CheckCircleOutlined className="check-icon" />
        </div>
        <div className="header-meta">
          <span
            className="date-text"
            style={{ color: `${isExpired ? '#dc2626' : '#475569'}` }}
          >
            {formattedExpiration || 'N/A'}
          </span>
          <div className="quantity-chip">
            {numberFormatter.format(numericQuantity)} uds
          </div>
        </div>
      </div>
      <div className="info-row location-row">
        <EnvironmentOutlined className="icon" />
        <LocationBadge className="location-badge">
          {formatLocation(locationId)}
        </LocationBadge>
      </div>
    </BatchCard>
  );
}

const Section = styled.div`
    & + & {
    margin-top: 24px;
  }
`;

const SectionTitle = styled.h3`
  margin: 12px 0 4px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
`;

const SectionNotice = styled.p`
  margin: 12px 0;
  font-size: 0.9rem;
  color: #64748b;
`;
