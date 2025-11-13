import {
  SearchOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { Modal, Button, Input, Empty, Spin } from 'antd';
import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';

import {
  addProduct,
  SelectCartData,
} from '../../../../../../../features/cart/cartSlice';
import {
  DEFAULT_FILTER_CONTEXT,
  selectStockLocations,
} from '../../../../../../../features/filterProduct/filterProductsSlice';
import {
  selectProductStockSimple,
  closeProductStockSimple,
} from '../../../../../../../features/productStock/productStockSimpleSlice';
import { useListenProductsStock } from '../../../../../../../firebase/warehouse/productStockService';
import { useLocationNames } from '../../../../../../../hooks/useLocationNames';

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

const LocationBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  margin-bottom: 4px;
  font-size: 0.8rem;
  color: #475569;
  background: #f1f5f9;
  border-radius: 6px;

    &:hover {
    background: #e2e8f0;
  }
`;

const BatchCard = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  cursor: pointer;
  background: white;
  border: 2px solid
    ${({ selected, $expired }) => {
      if (selected && $expired) return '#dc2626';
      if (selected) return '#2563eb';
      return '#e2e8f0';
    }};
  border-radius: 12px;
  box-shadow: ${({ selected, $expired }) => {
    if (selected && $expired) return '0 4px 12px rgba(220, 38, 38, 0.2)';
    if (selected) return '0 4px 12px rgba(37, 99, 235, 0.15)';
    return '0 2px 8px rgba(0, 0, 0, 0.05)';
  }};
  transition: all 0.2s ease;

    &:hover {
    box-shadow: 0 6px 16px rgb(0 0 0 / 10%);
    transform: translateY(-2px);
  }

  .card-header {
    /* padding-bottom: 2px; */

    /* border-bottom: 1px solid #e2e8f0; */
  }

  .card-content {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 12px;
  }

  .locations-column {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .info-column {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-left: 12px;
    border-left: 1px solid #e2e8f0;
  }

  .batch-number {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
  }

  .info-row {
    display: flex;
    gap: 6px;
    align-items: center;
    font-size: 0.85rem;
    color: #64748b;

    .icon {
      min-width: 16px;
      color: #94a3b8;
    }

    .date-container {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .quantity {
    font-weight: 500;
    color: #2563eb;
  }

  .check-icon {
    font-size: 18px;
    color: #2563eb;
    opacity: ${(props) => (props.selected ? 1 : 0)};
    transform: ${(props) => (props.selected ? 'scale(1)' : 'scale(0.5)')};
    transition: all 0.2s ease;
  }
`;

const StatusBadge = styled.span`
  padding: 0 8px;
  font-size: 0.7rem;
  font-weight: 600;
  color: ${(props) => (props.$expired ? '#dc2626' : '#15803d')};
  background: ${(props) => (props.$expired ? '#fee2e2' : '#dcfce7')};
  border-radius: 999px;
`;

export function ProductBatchModal() {
  const dispatch = useDispatch();
  const { isOpen, productId, product } = useSelector(selectProductStockSimple);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [searchText, setSearchText] = useState('');
  const { products } = useSelector(SelectCartData);
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();

  const filteredBySearch = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return productStocks;
    return productStocks.filter(
      (stock) =>
        stock.batchNumberId?.toString().toLowerCase().includes(term) ||
        stock.location?.toLowerCase().includes(term),
    );
  }, [productStocks, searchText]);

  const normalizeLocationId = (value) => {
    if (typeof value !== 'string') return '';
    return value.trim();
  };

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

  const { prioritizedBatches, otherLocationBatches, hasLocationFilter } =
    useMemo(() => {
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

  useEffect(() => {
    if (products.length === 0) {
      setSelectedBatch(null);
    }
  }, [products.length]);

  // Modificar la función formatLocation
  function formatLocation(locationId) {
    if (!locationId) return '';
    return locationNames[locationId] || 'Cargando...';
  }

  const handleBatchToggle = (stock, isExpired) => {
    if (!stock) return;

    const isCurrentlySelected = selectedBatch === stock.id;

    if (isCurrentlySelected) {
      setSelectedBatch(null);
      return;
    }

    if (isExpired) {
      Modal.confirm({
        title: 'Producto vencido',
        icon: <ExclamationCircleOutlined style={{ color: '#dc2626' }} />,
        content: 'El lote seleccionado está vencido. ¿Desea continuar?',
        okText: 'Continuar',
        cancelText: 'Cancelar',
        onOk: () => setSelectedBatch(stock.id),
      });
      return;
    }

    setSelectedBatch(stock.id);
  };

  const normalizeExpirationDate = (value) => {
    if (!value) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? null : parsed;
    }
    if (value.seconds !== undefined) {
      return value.seconds * 1000;
    }
    if (typeof value.toDate === 'function') {
      return value.toDate().getTime();
    }
    return null;
  };

  const handleConfirm = () => {
    if (selectedBatch) {
      const chosenStock = productStocks.find((s) => s.id === selectedBatch);

      if (!chosenStock) {
        return;
      }

      const batchInfo = {
        productStockId: chosenStock.id ?? null,
        batchId: chosenStock.batchId ?? null,
        batchNumber: chosenStock.batchNumberId ?? null,
        quantity: chosenStock.quantity ?? null,
        expirationDate: normalizeExpirationDate(chosenStock.expirationDate),
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
      dispatch(closeProductStockSimple());
    }
  };

  return (
    <StyledWrapper>
      <StyledModal
        open={isOpen}
        onCancel={() => dispatch(closeProductStockSimple())}
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
        <div className="search-container">
          <Input
            placeholder="Buscar por número de lote o ubicación..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ borderRadius: '8px' }}
          />
        </div>

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
                          normalizeExpirationDate,
                          formatLocation,
                          normalizeLocationId,
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
                          normalizeExpirationDate,
                          formatLocation,
                          normalizeLocationId,
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
                    normalizeExpirationDate,
                    formatLocation,
                    normalizeLocationId,
                  }),
                )}
              </BatchGrid>
            ) : (
              <Empty
                description="No se encontraron lotes"
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
  normalizeExpirationDate,
  formatLocation,
  normalizeLocationId,
}) {
  const expirationTimestamp = normalizeExpirationDate(stock.expirationDate);
  const isExpired =
    expirationTimestamp !== null && expirationTimestamp < todayTimestamp;
  const formattedExpiration = expirationTimestamp
    ? new Date(expirationTimestamp).toLocaleDateString()
    : null;
  const locationId = normalizeLocationId(stock.location);

  return (
    <BatchCard
      key={stock.id}
      selected={selectedBatch === stock.id}
      $expired={isExpired}
      onClick={() => handleBatchToggle(stock, isExpired)}
    >
      <div className="card-header">
        <div className="batch-number">
          Lote #{stock.batchNumberId}
          <CheckCircleOutlined className="check-icon" />
        </div>
      </div>
      <div className="card-content">
        <div className="locations-column">
          <LocationBadge>{formatLocation(locationId)}</LocationBadge>
        </div>
        <div className="info-column">
          <div className="info-row quantity">
            <span className="text">{stock.quantity} unidades</span>
          </div>
          <div className="info-row">
            {/* stylelint-disable-next-line nesting-selector-no-missing-scoping-root */}
            <CalendarOutlined className="icon" />
            <div className="date-container">
              <span
                className="text"
                style={{ color: `${isExpired ? '#dc2626' : 'inherit'}` }}
              >
                {formattedExpiration || 'N/A'}
              </span>
              {formattedExpiration && (
                <StatusBadge $expired={isExpired}>
                  {isExpired ? 'Vencido' : 'Vigente'}
                </StatusBadge>
              )}
            </div>
          </div>
        </div>
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
