import { SearchOutlined } from '@ant-design/icons';
import { faTimesCircle, faExclamationTriangle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { Input, Empty, Spin } from 'antd';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';

import { openDeleteModal } from '../../../../../../../features/productStock/deleteProductStockSlice';
import { useListenProductsStock } from '../../../../../../../firebase/warehouse/productStockService';
import { useLocationNames } from '../../../../../../../hooks/useLocationNames';

import BatchGroup from './components/BatchGroup';
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

const getStockStatus = (quantity) => {
  if (quantity <= 0) return {
    icon: faTimesCircle,
    color: '#dc2626',
    background: '#fee2e2',
    label: 'Sin Stock'
  };
  if (quantity < 10) return {
    icon: faExclamationTriangle,
    color: '#ea580c',
    background: '#ffedd5',
    label: 'Stock Bajo'
  };
  return {
    icon: faCheckCircle,
    color: '#059669',
    background: '#dcfce7',
    label: 'Stock OK'
  };
};

const SearchBar = styled(Input)`
  margin-bottom: 24px;
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

const ProductStockOverview = ({ }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchText, setSearchText] = useState('');
  const { productId } = useParams();
  const { data: stockData, loading } = useListenProductsStock(productId);
  const { locationNames, fetchLocationName } = useLocationNames();

  const filteredStock = React.useMemo(() => {
    if (!stockData) return [];
    return stockData.filter(stock => {
      const locationStr = String(stock.location || '');
      const batchStr = String(stock.batchNumberId || '');
      return locationStr.toLowerCase().includes(searchText.toLowerCase()) ||
        batchStr.toLowerCase().includes(searchText.toLowerCase());
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
    if (!stockData) return;
    stockData.forEach(stock => {
      if (stock.location && !locationNames[stock.location]) {
        fetchLocationName(stock.location);
      }
    });
  }, [stockData, locationNames, fetchLocationName]);

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
        <Empty description="No se ha seleccionado ningún producto" />
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <MainContent>
        <StockSummary filteredStock={filteredStock} productId={productId} />
        <SearchBar
          placeholder="Buscar por ubicación o número de lote..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredStock.length === 0 ? (
            <Empty description="No hay stock disponible para este producto" />
          ) : (
            Object.values(groupStockByBatch(filteredStock)).map((group) => (
              <BatchGroup
                key={group.batchId || 'sin-lote'}
                group={group}
                getStockStatus={getStockStatus}
                handleDeleteBatch={handleDeleteBatch}
                handleDeleteProductStock={handleDeleteProductStock}
                handleLocationClick={handleLocationClick}
                locationNames={locationNames}
              />
            ))
          )}
        </div>
      </MainContent>
      
      <SideContent>
        {/* BackOrderList se moverá a StockSummary */}
      </SideContent>
    </Container>
  );
};

export default ProductStockOverview;