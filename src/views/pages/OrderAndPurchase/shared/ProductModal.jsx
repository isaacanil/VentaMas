import { faImage } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Drawer, Input, message, Pagination, Tooltip } from 'antd';
import {
  collection,
  count,
  getAggregateFromServer,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../features/auth/userSlice';
import { db } from '../../../../firebase/firebaseconfig';
import { useGetProducts } from '../../../../firebase/products/fbGetProducts';
import { filterData } from '../../../../hooks/search/useSearch';

const Header = styled.div`
  padding: 0 1em;
`;

const ProductsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  align-content: start;
  align-items: start;
  padding: 0 1em;
  overflow-y: auto;
`;

const ProductCard = styled.button`
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
  padding: 8px;
  text-align: left;
  cursor: pointer;
  background-color: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #d9d9d9;
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

const TooltipRow = styled.p`
  margin: 0;
  font-size: ${({ $muted }) => ($muted ? '0.78rem' : '0.82rem')};
  line-height: 1.35;
  color: ${({ $muted }) => ($muted ? '#8c8c8c' : '#262626')};
`;

const TooltipHighlight = styled.span`
  font-weight: 600;
  color: #1d39c4;
`;

const ProductModal = ({ onSelect, selectedProduct, pageSize = 14 }) => {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (visible && searchInputRef.current) {
      const timeout = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [visible]);

  const user = useSelector(selectUser);
  const { products, loading } = useGetProducts(true);

  const [aggregateCounts, setAggregateCounts] = useState({
    inventory: null,
  });
  const [aggregateStatus, setAggregateStatus] = useState('idle');

  const inventoryProducts = useMemo(
    () =>
      Array.isArray(products)
        ? products.filter((product) => product?.trackInventory === true)
        : [],
    [products],
  );

  const filteredProducts = useMemo(
    () => (search ? filterData(inventoryProducts, search) : inventoryProducts),
    [inventoryProducts, search],
  );

  const totalFiltered = filteredProducts.length;

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, pageSize, totalFiltered]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedProducts = useMemo(
    () => filteredProducts.slice(startIndex, startIndex + pageSize),
    [filteredProducts, startIndex, pageSize],
  );

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

  const pageStart = paginatedProducts.length > 0 ? startIndex + 1 : 0;
  const pageEnd =
    paginatedProducts.length > 0 ? startIndex + paginatedProducts.length : 0;

  const formatNumber = useCallback((value) => {
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

  const pillLabel =
    pageStart === 0 && pageEnd === 0
      ? `0 / ${readableTotal}`
      : `${pageStart}-${pageEnd} / ${readableTotal}`;

  const formattedInventoryTotal = formatNumber(readableTotal);

  const tooltipContent = (
    <TooltipContent>
      {pageStart === 0 && pageEnd === 0 ? (
        <TooltipRow>
          No hay productos inventariables que coincidan con tu búsqueda.
        </TooltipRow>
      ) : (
        <TooltipRow>
          Estás viendo{' '}
          <TooltipHighlight>
            {pageStart}-{pageEnd}
          </TooltipHighlight>{' '}
          de <TooltipHighlight>{formattedInventoryTotal}</TooltipHighlight>{' '}
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

  const handleSelectProduct = (product) => {
    onSelect(product);
    setSearch('');
    setCurrentPage(1);
    setVisible(false);
    message.success('Producto seleccionado');
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  return (
    <div>
      <Input
        value={selectedProduct?.name || ''}
        placeholder="Buscar y seleccionar producto..."
        readOnly
        onClick={() => setVisible(true)}
      />
      <Drawer
        title="Lista de Productos"
        placement="bottom"
        onClose={() => setVisible(false)}
        open={visible}
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
            />
          </Header>

          <ProductsContainer>
            {paginatedProducts.map((product) => (
              <ProductCard
                key={product.id}
                type="button"
                onClick={() => handleSelectProduct(product)}
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
              </ProductCard>
            ))}
            {!loading && paginatedProducts.length === 0 && (
              <EmptyState>
                No se encontraron productos inventariables.
              </EmptyState>
            )}
          </ProductsContainer>

          <FooterRow>
            <Tooltip
              placement="topLeft"
              trigger={['hover', 'click']}
              title={tooltipContent}
            >
              <SummaryPill type="button">{pillLabel}</SummaryPill>
            </Tooltip>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              showSizeChanger={false}
              hideOnSinglePage
              simple={{ readOnly: true }}
              total={totalFiltered}
              onChange={(page) => setCurrentPage(page)}
            />
          </FooterRow>
        </Wrapper>
      </Drawer>
    </div>
  );
};

export default ProductModal;
