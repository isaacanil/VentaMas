import { CheckCircleOutlined, SearchOutlined } from '@/constants/icons/antd';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Drawer, Input, message, Tooltip, Button } from 'antd';
import type { InputRef } from 'antd';
import {
  collection,
  count,
  getAggregateFromServer,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useMemo, useRef, useState, useCallback, forwardRef } from 'react';
import type { ChangeEvent, HTMLAttributes, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { VirtuosoGrid } from 'react-virtuoso';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import { useGetProducts } from '@/firebase/products/fbGetProducts';
import { filterData } from '@/hooks/search/useSearch';
import type { UserIdentity } from '@/types/users';

const Header = styled.div`
  padding: 0 1em;
`;

// Styled component for VirtuosoGrid List
const GridListContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  align-content: start;
  align-items: start;
  padding: 0 1em 1em 1em; /* Added bottom padding */
`;

const ItemContainer = styled.div`
  height: 100%;
  display: flex; /* Ensure children expand */
`;

const ProductCard = styled.button<{ $isSelected?: boolean }>`
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
  padding: 8px;
  text-align: left;
  cursor: pointer;
  background-color: ${({ $isSelected }) => ($isSelected ? '#e6f4ff' : '#fff')};
  border: 1px solid ${({ $isSelected }) => ($isSelected ? '#1677ff' : '#e8e8e8')};
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ $isSelected }) => ($isSelected ? '#1677ff' : '#d9d9d9')};
    box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
  }
`;

const ImageContainer = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  overflow: hidden;
  background-color: #f5f5f5;
  border-radius: 6px;

  img,
  .placeholder-icon {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .placeholder-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: #d9d9d9;
  }
`;

const ProductInfo = styled.div`
  flex: 1;
  min-width: 0;

  .name {
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 13px;
    font-weight: 500;
    color: #262626;
    white-space: nowrap;
  }

  .barcode {
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 11px;
    color: #8c8c8c;
    white-space: nowrap;
  }
`;

const Wrapper = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  gap: 8px;
  height: 100%;
  overflow: hidden;
`;

const FooterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
  padding: 0 1em 0.2em;
`;

const EmptyState = styled.div`
  display: grid;
  place-items: center;
  padding: 1.5em;
  font-size: 0.9rem;
  color: #8c8c8c;
  height: 100%;
`;

const SummaryPill = styled.button`
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
  padding: 0.35rem 0.8rem;
  font-size: 0.85rem;
  line-height: 1;
  color: #1f1f1f;
  cursor: pointer;
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 999px;
  transition: all 0.2s ease;

  &:hover {
    color: #0958d9;
    background: #e6f4ff;
    border-color: #91caff;
  }

  &:focus-visible {
    outline: 2px solid #1677ff;
    outline-offset: 2px;
  }
`;

const TooltipContent = styled.div`
  display: grid;
  gap: 0.35rem;
  max-width: 260px;
`;

const TooltipRow = styled.p<{ $muted?: boolean }>`
  margin: 0;
  font-size: ${({ $muted }) => ($muted ? '0.78rem' : '0.82rem')};
  line-height: 1.35;
  color: ${({ $muted }) => ($muted ? '#8c8c8c' : '#262626')};
`;

const TooltipHighlight = styled.span`
  font-weight: 600;
  color: #1d39c4;
`;

const GridList = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ style, children, ...props }, ref) => (
    <GridListContainer ref={ref} style={style} {...props}>
      {children}
    </GridListContainer>
  ),
);

GridList.displayName = 'GridList';

type ProductOption = {
  id?: string;
  name?: string;
  barcode?: string;
  image?: string;
  trackInventory?: boolean;
  pricing?: { cost?: number; tax?: number };
  [key: string]: unknown;
};

interface ProductModalProps {
  onSelect: (product: ProductOption | ProductOption[]) => void;
  selectedProduct?: ProductOption | null;
  children?: ReactNode;
  multiselect?: boolean;
}

const ProductModal = ({
  onSelect,
  selectedProduct,
  children,
  multiselect = false,
}: ProductModalProps) => {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<InputRef | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<ProductOption[]>([]);

  useEffect(() => {
    if (visible && searchInputRef.current) {
      const timeout = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [visible]);

  const handleAfterOpenChange = useCallback(
    (open: boolean) => {
      if (open && multiselect) {
        setSelectedProducts([]);
      }
    },
    [multiselect],
  );

  const user = useSelector(selectUser) as UserIdentity | null;
  const { products = [], loading = false } = useGetProducts() as {
    products?: ProductOption[];
    loading?: boolean;
  };

  const [aggregateCounts, setAggregateCounts] = useState<{
    inventory: number | null;
  }>({
    inventory: null,
  });
  const [aggregateStatus, setAggregateStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const inventoryProducts = useMemo(
    () =>
      Array.isArray(products)
        ? products.filter((product) => product?.trackInventory !== false)
        : [],
    [products],
  );

  const filteredProducts = useMemo(
    () => (search ? filterData(inventoryProducts, search) : inventoryProducts),
    [inventoryProducts, search],
  );

  const totalFiltered = filteredProducts.length;

  useEffect(() => {
    if (!visible || !user?.businessID) return;

    let isMounted = true;

    const fetchAggregates = async () => {
      setAggregateStatus('loading');
      try {
        const businessID = String(user.businessID);
        const productsRef = collection(
          db,
          'businesses',
          businessID,
          'products',
        );
        const inventoryProductsQuery = query(
          productsRef,
          where('isDeleted', '==', false),
          where('trackInventory', '==', true),
        );

        const inventorySnapshot = await getAggregateFromServer(
          inventoryProductsQuery,
          {
            total: count(),
          },
        );

        if (!isMounted) return;

        setAggregateCounts({
          inventory: inventorySnapshot?.data()?.total ?? 0,
        });
        setAggregateStatus('success');
      } catch (error) {
        console.error(
          '[ProductModal] Error al obtener conteos de productos',
          error,
        );
        if (!isMounted) return;
        setAggregateCounts({
          inventory: null,
        });
        setAggregateStatus('error');
      }
    };

    fetchAggregates();

    return () => {
      isMounted = false;
    };
  }, [visible, user?.businessID]);

  const formatNumber = useCallback((value: number | null | undefined) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value.toLocaleString('es-DO');
    }
    return '—';
  }, []);

  const countsLoading = aggregateStatus === 'loading';
  const countsError = aggregateStatus === 'error';
  const countsSuccess = aggregateStatus === 'success';

  const inventoryTotal =
    countsSuccess && typeof aggregateCounts.inventory === 'number'
      ? aggregateCounts.inventory
      : totalFiltered;

  const readableTotal = Math.max(inventoryTotal || 0, totalFiltered || 0);

  const pillLabel = `${readableTotal} productos`;

  const formattedInventoryTotal = formatNumber(readableTotal);

  const tooltipContent = (
    <TooltipContent>
      {totalFiltered === 0 ? (
        <TooltipRow>
          No hay productos inventariables que coincidan con tu búsqueda.
        </TooltipRow>
      ) : (
        <TooltipRow>
          Mostrando <TooltipHighlight>{totalFiltered}</TooltipHighlight> de{' '}
          <TooltipHighlight>{formattedInventoryTotal}</TooltipHighlight>{' '}
          productos inventariables.
        </TooltipRow>
      )}
      {countsLoading && (
        <TooltipRow $muted>Calculando totales del catálogo...</TooltipRow>
      )}
      <TooltipRow $muted>
        Los productos no inventariables no se listan en este selector.
      </TooltipRow>
      {countsError && (
        <TooltipRow $muted>
          No se pudo obtener el conteo global. Intenta nuevamente más tarde.
        </TooltipRow>
      )}
    </TooltipContent>
  );

  const handleSelectProduct = (product: ProductOption) => {
    if (multiselect) {
      setSelectedProducts((prev) => {
        const exists = prev.some((p) => p.id === product.id);
        if (exists) {
          return prev.filter((p) => p.id !== product.id);
        }
        return [...prev, product];
      });
    } else {
      onSelect(product);
      setSearch('');
      setVisible(false);
      message.success('Producto seleccionado');
    }
  };

  const handleConfirmSelection = () => {
    if (selectedProducts.length === 0) {
      message.warning('Selecciona al menos un producto');
      return;
    }
    onSelect(selectedProducts);
    setSearch('');
    setVisible(false);
    message.success(`${selectedProducts.length} productos seleccionados`);
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const isSelected = (product: ProductOption) =>
    multiselect && selectedProducts.some((p) => p.id === product.id);

  return (
    <div>
      {children ? (
        <div onClick={() => setVisible(true)}>{children}</div>
      ) : (
        <Input
          value={selectedProduct?.name || ''}
          placeholder="Buscar y seleccionar producto..."
          readOnly
          onClick={() => setVisible(true)}
        />
      )}
      <Drawer
        title={
          multiselect
            ? `Seleccionar Productos (${selectedProducts.length})`
            : 'Lista de Productos'
        }
        placement="bottom"
        onClose={() => setVisible(false)}
        open={visible}
        afterOpenChange={handleAfterOpenChange}
        loading={loading}
        height="80%"
        styles={{ body: { padding: '1em' } }}
        width={1000}
      >
        <Wrapper>
          <Header>
            <Input
              ref={searchInputRef}
              placeholder="Buscar productos..."
              value={search}
              onChange={handleSearchChange}
              allowClear
              style={{ maxWidth: '300px' }}
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            />
          </Header>

          <div style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
            {filteredProducts.length === 0 && !loading ? (
              <EmptyState>
                No se encontraron productos inventariables.
              </EmptyState>
            ) : (
              <VirtuosoGrid
                style={{ height: '100%' }}
                totalCount={filteredProducts.length}
                components={{
                  List: GridList,
                  Item: ItemContainer,
                }}

                itemContent={(index) => {
                  const product = filteredProducts[index];
                  return (
                    <ProductCard
                      key={product.id}
                      type="button"
                      onClick={() => handleSelectProduct(product)}
                      $isSelected={isSelected(product)}
                    >
                      <ImageContainer>
                        {product.image ? (
                          <img src={product.image} alt={product.name} />
                        ) : (
                          <div className="placeholder-icon">
                            <FontAwesomeIcon icon={faImage} />
                          </div>
                        )}
                      </ImageContainer>
                      <ProductInfo>
                        <div className="name">{product?.name}</div>
                        <div className="barcode">
                          {product?.barcode || 'Sin código de barras'}
                        </div>
                      </ProductInfo>
                      {isSelected(product) && (
                        <CheckCircleOutlined
                          style={{ color: '#1677ff', fontSize: '1.2em' }}
                        />
                      )}
                    </ProductCard>
                  );
                }}
              />
            )}
          </div>

          <FooterRow>
            <Tooltip
              placement="topLeft"
              trigger={['hover', 'click']}
              title={tooltipContent}
            >
              <SummaryPill type="button">{pillLabel}</SummaryPill>
            </Tooltip>
            {multiselect && (
              <Button type="primary" onClick={handleConfirmSelection}>
                Agregar ({selectedProducts.length})
              </Button>
            )}
          </FooterRow>
        </Wrapper>
      </Drawer>
    </div>
  );
};

export default ProductModal;
