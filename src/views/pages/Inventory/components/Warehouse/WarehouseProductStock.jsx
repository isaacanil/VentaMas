import { Empty } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import { ResizableSidebar } from '../../../../component/ResizebleSidebar/ResizebleSidebar';
import { MenuApp } from '../../../../templates/MenuApp/MenuApp';

import InventoryMenu from './components/DetailView/InventoryMenu';
import { PRODUCT_STOCK_FILTER_OPTIONS } from './components/ProductStockBrowser/constants.js';
import ProductStockBrowser from './components/ProductStockBrowser/ProductStockBrowser';
import ProductStockOverview from './components/ProductStockOverview/ProductStockOverview';

const Container = styled.div`
  display: grid;
  grid-template-rows: min-content min-content 1fr;
  height: 100%;
  overflow: hidden;
`;

const Content = styled.div`
  height: 100%;
  overflow: auto;
`;

const EmptyWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

export const WarehouseProductStock = () => {
  const { productId } = useParams();
  const [activeFilters, setActiveFilters] = useState([]);
  const [productStats, setProductStats] = useState({
    totalProducts: 0,
    visibleProducts: 0,
    loading: true,
    hasFilters: false,
  });

  const summaryText = useMemo(() => {
    if (productStats.loading) {
      return 'Cargando productos...';
    }
    if (!productStats.totalProducts) {
      return 'Sin productos activos en stock';
    }
    if (activeFilters.length) {
      return `Mostrando ${productStats.visibleProducts} de ${productStats.totalProducts} producto${productStats.totalProducts === 1 ? '' : 's'}`;
    }
    return `${productStats.totalProducts} producto${productStats.totalProducts === 1 ? '' : 's'} con stock activo`;
  }, [productStats, activeFilters.length]);

  const handleStatsChange = useCallback((stats) => {
    setProductStats(
      stats || {
        totalProducts: 0,
        visibleProducts: 0,
        loading: false,
        hasFilters: false,
      },
    );
  }, []);

  const handleFiltersChange = useCallback((filters) => {
    setActiveFilters(Array.isArray(filters) ? filters : []);
  }, []);

  return (
    <Container>
      <MenuApp sectionName="Almacenes" />
      <InventoryMenu />
      <ResizableSidebar
        Sidebar={
          <ProductStockBrowser
            activeFilters={activeFilters}
            onStatsChange={handleStatsChange}
            onFiltersChange={handleFiltersChange}
            summaryText={summaryText}
            filterOptions={PRODUCT_STOCK_FILTER_OPTIONS}
          />
        }
      >
        <Content>
          {productId ? (
            <ProductStockOverview />
          ) : (
            <EmptyWrapper>
              <Empty description="Selecciona un producto para ver su stock" />
            </EmptyWrapper>
          )}
        </Content>
      </ResizableSidebar>
    </Container>
  );
};

export default WarehouseProductStock;
