import { SearchOutlined } from '@ant-design/icons';
import { faTimesCircle, faExclamationTriangle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { Input, Empty, Spin, Segmented } from 'antd';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';

import { openDeleteModal } from '../../../../../../../features/productStock/deleteProductStockSlice';
import { useListenProductsStock } from '../../../../../../../firebase/warehouse/productStockService';
import { useLocationNames } from '../../../../../../../hooks/useLocationNames';
import useStockAlertThresholds from '../../../../../../../hooks/useStockAlertThresholds';

import BatchGroup from './components/BatchGroup';
import ProductStockTable from './components/ProductStockTable';
import StockSummary from './components/StockSummary';


const Container = styled.div`
  padding: 16px;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  background: #ffffff;
  display: grid;
  gap: 24px;
  align-items: start;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SideContent = styled.div`
  position: sticky;
  top: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  @media (max-width: 1200px) {
    position: relative;
    top: 0;
  }
`;

const SearchBar = styled(Input)`
  width: 100%;
  border-radius: 8px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  background: #ffffff;

  .ant-input {
    font-size: 0.95rem;
  }

  .ant-input-prefix {
    color: #64748b;
    margin-right: 8px;
    font-size: 1rem;
  }

  &:hover, &:focus {
    border-color: #cbd5e1;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04);
  }
`;

const ControlsBar = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: space-between;
  flex-wrap: wrap;
`;

const SearchWrapper = styled.div`
  width: 400px;
  max-width: 100%;
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ViewModeToggle = styled(Segmented)`
  background: #f8fafc;
  border-radius: 999px;
  padding: 4px;
  flex-shrink: 0;

  .ant-segmented-item {
    font-weight: 600;
    font-size: 0.8rem;
    color: #475569;
    padding: 6px 16px;
    transition: all 0.2s ease;
  }

  .ant-segmented-item-selected {
    background: #2563eb;
    color: #ffffff;
    box-shadow: 0 6px 18px -10px rgba(37, 99, 235, 0.8);
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const CenteredState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 40px 16px;
`;

const LoadingState = styled(CenteredState)`
  flex-direction: column;
  gap: 16px;
`;

const ThresholdLegend = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 8px;
`;

const LegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const LegendDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  display: inline-flex;
`;

function ProductStockOverview() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    // Detectar si es un dispositivo móvil o tablet (ancho < 1024px)
    return window.innerWidth < 1024 ? 'batches' : 'table';
  });
  const { productId } = useParams();
  const { data: stockData, loading } = useListenProductsStock(productId);
  const { locationNames, fetchLocationName } = useLocationNames();
  const { lowThreshold, criticalThreshold } = useStockAlertThresholds();

  // Ajustar vista según el tamaño de la pantalla
  React.useEffect(() => {
    const handleResize = () => {
      const isSmallScreen = window.innerWidth < 1024;
      setViewMode(prev => {
        // Si estamos en pantalla pequeña y la vista es tabla, cambiar a lotes
        if (isSmallScreen && prev === 'table') return 'batches';
        // Si estamos en pantalla grande y la vista es lotes, cambiar a tabla
        if (!isSmallScreen && prev === 'batches') return 'table';
        return prev;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredStock = React.useMemo(() => {
    if (!stockData) return [];
    const normalizedQuery = searchText.trim().toLowerCase();
    if (!normalizedQuery) return stockData;
    return stockData.filter(stock => {
      const locationStr = String(stock.location || '').toLowerCase();
      const batchStr = String(stock.batchNumberId || '').toLowerCase();
      return locationStr.includes(normalizedQuery) || batchStr.includes(normalizedQuery);
    });
  }, [stockData, searchText]);

  const handleLocationClick = React.useCallback((locationPath) => {
    const [warehouseId, shelfId, rowId, segmentId] = locationPath.split('/');
    let navigationPath = `/inventory/warehouses/warehouse/${warehouseId}`;
    if (shelfId) {
      navigationPath += `/shelf/${shelfId}`;
      if (rowId) {
        navigationPath += `/row/${rowId}`;
        if (segmentId) {
          navigationPath += `/segment/${segmentId}`;
        }
      }
    }
    navigate(navigationPath);
  }, [navigate]);

  React.useEffect(() => {
    if (!stockData?.length) return;
    const locations = new Set();
    stockData.forEach(stock => {
      if (stock.location) {
        locations.add(stock.location);
      }
    });
    if (!locations.size) return;
    locations.forEach((location) => {
      fetchLocationName(location);
    });
  }, [stockData, fetchLocationName]);

  const groupStockByBatch = React.useCallback((stocks) => {
    if (!stocks.length) return {};
    return stocks.reduce((groups, stock) => {
      const batchKey = stock.batchId || 'sin-lote';
      if (!groups[batchKey]) {
        groups[batchKey] = {
          batchId: stock.batchId,
          batchNumberId: stock.batchNumberId,
          expirationDate: stock.expirationDate,
          productName: stock.productName,
          items: [],
          total: 0
        };
      }
      groups[batchKey].items.push(stock);
      groups[batchKey].total += stock.quantity;
      return groups;
    }, {});
  }, []);

  const groupedStock = React.useMemo(
    () => groupStockByBatch(filteredStock),
    [filteredStock, groupStockByBatch]
  );

  const getStockStatus = React.useCallback((quantity) => {
    const parsed = Number(quantity) || 0;
    if (parsed <= 0) {
      return {
        icon: faTimesCircle,
        color: '#dc2626',
        background: '#fee2e2',
        label: 'Sin stock',
      };
    }
    if (parsed <= criticalThreshold) {
      return {
        icon: faExclamationTriangle,
        color: '#dc2626',
        background: '#fee2e2',
        label: 'Stock crítico',
      };
    }
    if (parsed <= lowThreshold) {
      return {
        icon: faExclamationTriangle,
        color: '#ea580c',
        background: '#ffedd5',
        label: 'Stock bajo',
      };
    }
    return {
      icon: faCheckCircle,
      color: '#059669',
      background: '#dcfce7',
      label: 'Stock OK',
    };
  }, [criticalThreshold, lowThreshold]);

  const handleDeleteBatch = (group) => {
    dispatch(openDeleteModal({
      productStockId: null,
      batchId: group.batchId,
      actionType: 'batch',
    }));
  };

  const handleDeleteProductStock = (stock) => {
    dispatch(openDeleteModal({
      productStockId: stock.id,
      batchId: stock.batchId,
      actionType: 'productStock',
    }));
  };

  if (!productId) {
    return (
      <Container>
        <CenteredState>
          <Empty description="No se ha seleccionado ningún producto" />
        </CenteredState>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <LoadingState>
          <Spin size="large" />
        </LoadingState>
      </Container>
    );
  }

  return (
    <Container>
      <MainContent>
        <StockSummary filteredStock={filteredStock} productId={productId} />
        <ControlsBar>
          <SearchWrapper>
            <SearchBar
              placeholder="Buscar por ubicación o número de lote..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </SearchWrapper>
          <ViewModeToggle
            options={[
              { label: 'Lotes', value: 'batches' },
              { label: 'Tabla', value: 'table' },
            ]}
            value={viewMode}
            onChange={setViewMode}
          />
        </ControlsBar>
        <ThresholdLegend>
          <LegendItem>
            <LegendDot $color="#dc2626" />
            Stock crítico ≤ {criticalThreshold.toLocaleString()} uds
          </LegendItem>
          <LegendItem>
            <LegendDot $color="#ea580c" />
            Stock bajo ≤ {lowThreshold.toLocaleString()} uds
          </LegendItem>
        </ThresholdLegend>
        {filteredStock.length === 0 ? (
          <Empty description="No hay stock disponible para este producto" />
        ) : viewMode === 'table' ? (
          <ProductStockTable
            stocks={filteredStock}
            getStockStatus={getStockStatus}
            handleLocationClick={handleLocationClick}
            handleDeleteProductStock={handleDeleteProductStock}
            locationNames={locationNames}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.values(groupedStock).map((group) => (
              <BatchGroup
                key={group.batchId || 'sin-lote'}
                group={group}
                getStockStatus={getStockStatus}
                handleDeleteBatch={handleDeleteBatch}
                handleDeleteProductStock={handleDeleteProductStock}
                handleLocationClick={handleLocationClick}
                locationNames={locationNames}
              />
            ))}
          </div>
        )}
      </MainContent>
      
      <SideContent>
        {/* BackOrderList se moverá a StockSummary */}
      </SideContent>
    </Container>
  );
}

export default ProductStockOverview;
