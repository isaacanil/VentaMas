import { FilterOutlined } from '@/constants/icons/antd';
import { Button, Checkbox, Empty, Popover } from 'antd';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';

import {
  useInventoryProductIds,
  useListenAllActiveProductsStock,
} from '@/hooks/useProductStock';
import { replacePathParams } from '@/router/routes/replacePathParams';
import ROUTES_PATH from '@/router/routes/routesName';
import Tree from '@/modules/inventory/components/tree/Tree';
import type { TreeConfig as BaseTreeConfig } from '@/modules/inventory/components/tree/Tree';

import { PRODUCT_STOCK_FILTER_OPTIONS as BASE_PRODUCT_STOCK_FILTER_OPTIONS } from './constants';

type ProductStockRecord = ReturnType<
  typeof useListenAllActiveProductsStock
>['data'][number];

type ProductStockFilterOption = {
  value: string;
  label: string;
  description?: string;
  test?: (product: ProductStockRecord) => boolean;
};

type ProductStockStats = {
  totalProducts: number;
  visibleProducts: number;
  loading: boolean;
  hasFilters: boolean;
};

type TreeNodeDetail = {
  text: string;
  type?: string;
};

type TreeNodeData = {
  id: string;
  name: string;
  extraDetails?: TreeNodeDetail[];
  stockSummary?: string | null;
  stockSummaryLoading?: boolean;
  record?: ProductStockRecord;
  tooltipDetails?: string[];
};

type TreeHeaderAction = {
  key: string;
  render: () => ReactNode;
};

type TreeConfig = BaseTreeConfig & {
  actions?: unknown[];
  headerActions?: TreeHeaderAction[];
  onNodeClick?: (node: TreeNodeData) => void;
  showMatchedStockCount?: boolean;
  showLocationStockSummary?: boolean;
  disableStockSummaryDetails?: boolean;
  disableStockSummaryTooltip?: boolean;
};

type ProductStockBrowserProps = {
  activeFilters?: string[];
  onStatsChange?: (stats: ProductStockStats) => void;
  onFiltersChange?: (filters: string[]) => void;
  summaryText?: ReactNode;
  filterOptions?: ProductStockFilterOption[];
};

const PRODUCT_STOCK_FILTER_OPTIONS: ProductStockFilterOption[] =
  BASE_PRODUCT_STOCK_FILTER_OPTIONS;

const FILTERS_BY_VALUE = PRODUCT_STOCK_FILTER_OPTIONS.reduce<
  Record<string, ProductStockFilterOption>
>((acc, option) => {
  acc[option.value] = option;
  return acc;
}, {});

const Centered = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`;

const FiltersPopoverContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 240px;
  max-width: 260px;
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
  gap: 8px;
  align-items: flex-start;

  .ant-checkbox + span {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 4px;
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
  line-height: 1.2;
  color: #6b7280;
`;

const FiltersFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ClearFiltersButton = styled(Button)`
  padding: 0;
`;

const SummaryBubble = styled.div`
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 10px 16px;
  font-size: 0.8rem;
  color: #f8fafc;
  pointer-events: auto;
  background: rgb(15 23 42 / 92%);
  border-radius: 999px;
  box-shadow: 0 10px 30px rgb(15 23 42 / 20%);
`;

const ProductStockBrowser = ({
  activeFilters = [],
  onStatsChange,
  onFiltersChange,
  summaryText,
  filterOptions = PRODUCT_STOCK_FILTER_OPTIONS,
}: ProductStockBrowserProps) => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId?: string }>();
  const { data: products = [], loading: stockLoading } =
    useListenAllActiveProductsStock();
  const { data: inventoryProductIds, loading: inventoryLoading } =
    useInventoryProductIds();
  const { PRODUCT_STOCK } = ROUTES_PATH.INVENTORY_TERM;
  const hasFilters = activeFilters.length > 0;
  const [filtersPopoverOpen, setFiltersPopoverOpen] = useState(false);

  const inventoryProducts = useMemo<ProductStockRecord[]>(() => {
    if (inventoryLoading) return [];
    if (!(inventoryProductIds instanceof Set)) return [];
    return products.filter((product) => inventoryProductIds.has(product.id));
  }, [products, inventoryProductIds, inventoryLoading]);

  const filteredProducts = useMemo<ProductStockRecord[]>(() => {
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

  const treeData = useMemo<TreeNodeData[]>(
    () =>
      filteredProducts
        .filter((product) => Boolean(product?.id))
        .map((product) => {
          const productId = String(product.id || '');
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
            id: productId,
            name: `${product.name ?? ''} ${product.barcode ?? ''}`.trim(),
            extraDetails: detailItems,
            stockSummary:
              typeof product.stockSummary === 'string'
                ? product.stockSummary
                : null,
            stockSummaryLoading: false,
            record: product,
            tooltipDetails: [longLotLabel, longStockLabel, longLocationLabel],
          };
        }),
    [filteredProducts],
  );

  const handleFiltersChange = useCallback(
    (values: Array<string | number>) => {
      if (typeof onFiltersChange === 'function') {
        onFiltersChange(values.map(String));
      }
    },
    [onFiltersChange],
  );

  const handleClearFilters = useCallback(() => {
    handleFiltersChange([]);
  }, [handleFiltersChange]);

  const filtersContent = useMemo<ReactNode>(
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

  const headerActions = useMemo<TreeHeaderAction[]>(
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

  const summaryFooterNode = useMemo<ReactNode>(
    () => (summaryText ? <SummaryBubble>{summaryText}</SummaryBubble> : null),
    [summaryText],
  );

  const config = useMemo<TreeConfig>(
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
