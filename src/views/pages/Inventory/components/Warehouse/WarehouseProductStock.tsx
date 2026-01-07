import { Empty } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import { ResizableSidebar } from '@/views/component/ResizebleSidebar/ResizebleSidebar';
import { MenuApp } from '@/views/templates/MenuApp/MenuApp';

import InventoryMenu from './components/DetailView/InventoryMenu';
import {
  PRODUCT_STOCK_FILTER_OPTIONS,
  type ProductStockFilterOption,
} from './components/ProductStockBrowser/constants';
import ProductStockBrowser from './components/ProductStockBrowser/ProductStockBrowser';
import ProductStockOverview from './components/ProductStockOverview/ProductStockOverview';

type ProductStockFilter = ProductStockFilterOption['value'];

interface ProductStats {
  totalProducts: number;
  visibleProducts: number;
  loading: boolean;
  hasFilters: boolean;
}

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
  const { productId } = useParams<{ productId?: string }>();
  const [activeFilters, setActiveFilters] = useState<ProductStockFilter[]>([]);
  const [productStats, setProductStats] = useState<ProductStats>({
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

  const handleStatsChange = useCallback((stats?: ProductStats | null) => {
    setProductStats(
      stats || {
        totalProducts: 0,
        visibleProducts: 0,
        loading: false,
        hasFilters: false,
      },
    );
  }, []);

  const handleFiltersChange = useCallback(
    (filters?: ProductStockFilter[] | null) => {
      setActiveFilters(Array.isArray(filters) ? filters : []);
    },
    [],
  );

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
