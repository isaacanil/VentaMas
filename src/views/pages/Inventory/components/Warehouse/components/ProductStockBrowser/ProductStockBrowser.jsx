import { FilterOutlined } from '@ant-design/icons';
import { Button, Checkbox, Empty, Popover } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';

import {
  useInventoryProductIds,
  useListenAllActiveProductsStock,
} from '../../../../../../../firebase/warehouse/productStockService';
import { replacePathParams } from '../../../../../../../routes/replacePathParams';
import ROUTES_PATH from '../../../../../../../routes/routesName';
import Tree from '../../../../../../component/tree/Tree';

import { PRODUCT_STOCK_FILTER_OPTIONS as BASE_PRODUCT_STOCK_FILTER_OPTIONS } from './constants';

const PRODUCT_STOCK_FILTER_OPTIONS = BASE_PRODUCT_STOCK_FILTER_OPTIONS;

const FILTERS_BY_VALUE = PRODUCT_STOCK_FILTER_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option;
  return acc;
}, {});

const Centered = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  flex-direction: column;
  gap: 12px;
  position: relative;
  width: 100%;
`;

const FiltersPopoverContent = styled.div`
  min-width: 240px;
  max-width: 260px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FiltersList = styled.div`
  display: grid;
  gap: 10px;

  .ant-checkbox-group {
    display: grid;
    gap: 10px;
  }
`;

const FilterCheckbox = styled(Checkbox)`
  display: flex;
  align-items: flex-start;
  gap: 8px;

  .ant-checkbox + span {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    color: #0f172a;
  }

  .ant-checkbox-inner {
    border-radius: 4px;
  }
`;

const FilterLabel = styled.span`
  font-weight: 500;
  color: #0f172a;
`;

const FilterDescription = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.2;
`;

const FiltersFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ClearFiltersButton = styled(Button)`
  padding: 0;
`;

const SummaryBubble = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.92);
  color: #f8fafc;
  font-size: 0.8rem;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.2);
  pointer-events: auto;
`;

const ProductStockBrowser = ({
  activeFilters = [],
  onStatsChange,
  onFiltersChange,
  summaryText,
  filterOptions = PRODUCT_STOCK_FILTER_OPTIONS,
}) => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { data: products = [], loading: stockLoading } =
    useListenAllActiveProductsStock();
  const { data: inventoryProductIds, loading: inventoryLoading } =
    useInventoryProductIds();
  const { PRODUCT_STOCK } = ROUTES_PATH.INVENTORY_TERM;
  const hasFilters = activeFilters.length > 0;
  const [filtersPopoverOpen, setFiltersPopoverOpen] = useState(false);

  const inventoryProducts = useMemo(() => {
    if (inventoryLoading) return [];
    if (!(inventoryProductIds instanceof Set)) return [];
    return products.filter((product) => inventoryProductIds.has(product.id));
  }, [products, inventoryProductIds, inventoryLoading]);

  const filteredProducts = useMemo(() => {
    if (!hasFilters) return inventoryProducts;
    return inventoryProducts.filter((product) =>
      activeFilters.every((filterKey) => {
        const filter = FILTERS_BY_VALUE[filterKey];
        if (!filter?.test) return true;
        return filter.test(product);
      }),
    );
  }, [inventoryProducts, activeFilters, hasFilters]);

  const totalProducts = inventoryProducts.length;
  const visibleProducts = filteredProducts.length;
  const combinedLoading = stockLoading || inventoryLoading;

  useEffect(() => {
    if (typeof onStatsChange === 'function') {
      onStatsChange({
        totalProducts,
        visibleProducts,
        loading: combinedLoading,
        hasFilters,
      });
    }
  }, [
    onStatsChange,
    totalProducts,
    visibleProducts,
    combinedLoading,
    hasFilters,
  ]);

  const treeData = useMemo(
    () =>
      filteredProducts.map((product) => {
        const lotCount = Number(product.uniqueBatches ?? 0);
        const productStockCount = Number(product.stockRecords ?? 0);
        const locationCount = Number(product.uniqueLocations ?? 0);
        const longLotLabel = `${lotCount} ${lotCount === 1 ? 'lote activo' : 'lotes activos'}`;
        const longStockLabel = `${productStockCount} ${productStockCount === 1 ? 'registro de stock activo' : 'registros de stock activos'}`;
        const longLocationLabel = `${locationCount} ${locationCount === 1 ? 'ubicación con stock' : 'ubicaciones con stock'}`;
        const detailItems = [
          {
            text: `${productStockCount} ${productStockCount === 1 ? 'registro de stock' : 'registros de stock'}`,
            type: productStockCount > 0 ? 'default' : 'actual-empty',
          },
        ];

        return {
          id: product.id,
          name: `${product.name ?? ''} ${product.barcode ?? ''}`.trim(),
          extraDetails: detailItems,
          stockSummary: product.stockSummary,
          stockSummaryLoading: false,
          record: product,
          tooltipDetails: [longLotLabel, longStockLabel, longLocationLabel],
        };
      }),
    [filteredProducts],
  );

  const handleFiltersChange = useCallback(
    (values) => {
      if (typeof onFiltersChange === 'function') {
        onFiltersChange(values);
      }
    },
    [onFiltersChange],
  );

  const handleClearFilters = useCallback(() => {
    handleFiltersChange([]);
  }, [handleFiltersChange]);

  const filtersContent = useMemo(
    () => (
      <FiltersPopoverContent>
        <FiltersList>
          <Checkbox.Group value={activeFilters} onChange={handleFiltersChange}>
            {filterOptions.map((option) => (
              <FilterCheckbox key={option.value} value={option.value}>
                <FilterLabel>{option.label}</FilterLabel>
                {option.description && (
                  <FilterDescription>{option.description}</FilterDescription>
                )}
              </FilterCheckbox>
            ))}
          </Checkbox.Group>
        </FiltersList>
        <FiltersFooter>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {activeFilters.length
              ? `${activeFilters.length} filtro${activeFilters.length === 1 ? '' : 's'} activo${activeFilters.length === 1 ? '' : 's'}`
              : 'Sin filtros aplicados'}
          </span>
          {activeFilters.length > 0 && (
            <ClearFiltersButton type="link" onClick={handleClearFilters}>
              Limpiar
            </ClearFiltersButton>
          )}
        </FiltersFooter>
      </FiltersPopoverContent>
    ),
    [activeFilters, filterOptions, handleFiltersChange, handleClearFilters],
  );

  const headerActions = useMemo(
    () => [
      {
        key: 'filters',
        render: () => (
          <Popover
            content={filtersContent}
            trigger="click"
            placement="bottomRight"
            open={filtersPopoverOpen}
            onOpenChange={setFiltersPopoverOpen}
          >
            <Button
              icon={<FilterOutlined />}
              type={hasFilters ? 'primary' : 'default'}
              shape="circle"
            />
          </Popover>
        ),
      },
    ],
    [filtersContent, filtersPopoverOpen, hasFilters],
  );

  const summaryFooterNode = useMemo(
    () => (summaryText ? <SummaryBubble>{summaryText}</SummaryBubble> : null),
    [summaryText],
  );

  const config = useMemo(
    () => ({
      actions: [],
      headerActions,
      showToggleAllButton: false,
      searchPlaceholder: 'Buscar productos por nombre o código...',
      showInitialVisibleInfoMessage: false,
      footerPlacement: 'sticky',
      onNodeClick: (node) => {
        navigate(replacePathParams(PRODUCT_STOCK, [node.id]));
      },
      showMatchedStockCount: false,
      showLocationStockSummary: true,
      disableStockSummaryDetails: true,
      disableStockSummaryTooltip: true,
      initialVisibleCount: 30,
      footer: summaryFooterNode,
    }),
    [navigate, PRODUCT_STOCK, headerActions, summaryFooterNode],
  );

  const showEmptyState = !combinedLoading && treeData.length === 0;

  let listContent;
  if (showEmptyState) {
    listContent = (
      <Centered>
        <Empty
          description={
            hasFilters
              ? 'No hay productos que coincidan con los filtros seleccionados'
              : 'No hay productos con stock activo'
          }
        />
        {summaryFooterNode}
      </Centered>
    );
  } else {
    listContent = (
      <Tree
        data={treeData}
        config={config}
        selectedId={productId}
        loading={combinedLoading}
        loadingText="Cargando productos..."
      />
    );
  }

  return listContent;
};

export default ProductStockBrowser;
