import { Button, Input, message } from 'antd';
import React, { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import type { ColumnsType } from 'antd/es/table';


import { icons } from '@/constants/icons/icons';
import {
  addProductInvoiceForm,
  changeAmountToBuyProduct,
  deleteProductInvoiceForm,
} from '@/features/invoice/invoiceFormSlice';
import { useGetProducts } from '@/firebase/products/fbGetProducts';
import { formatPrice } from '@/utils/format';
import { toNumber } from '@/utils/number/toNumber';
import { getTotalPrice } from '@/utils/pricing';
import type { InvoiceData, InvoiceProduct } from '@/types/invoice';

import { getCategoryName, getCategoryStats } from './productDataUtils';
import type { CategoryLike } from './productDataUtils';
import { ProductFilterToolbar } from './ProductFilterToolbar';
import { ProductListModal } from './ProductListModal';
import { StyledProductTable } from './ProductTables.styles';

const getProductQuantity = (product?: InvoiceProduct | null) => {
  if (!product) return 1;
  const { amountToBuy } = product;

  if (typeof amountToBuy === 'number') {
    return amountToBuy > 0 ? amountToBuy : 1;
  }

  if (amountToBuy && typeof amountToBuy === 'object') {
    const total = Number((amountToBuy as { total?: number }).total);
    const unit = Number((amountToBuy as { unit?: number }).unit);

    if (!Number.isNaN(total) && total > 0) return total;
    if (!Number.isNaN(unit) && unit > 0) return unit;
  }

  return 1;
};

const getFormattedUnitPrice = (product: InvoiceProduct) => {
  const quantity = getProductQuantity(product);
  const total = getTotalPrice(product);
  const unitPrice = quantity > 0 ? total / quantity : total;
  return formatPrice(unitPrice);
};

const getFormattedTotalPrice = (product: InvoiceProduct) =>
  formatPrice(getTotalPrice(product));

interface ProductsProps {
  invoice: InvoiceData;
  isEditLocked?: boolean;
}

export const Products = ({ invoice, isEditLocked = false }: ProductsProps) => {
  const dispatch = useDispatch();
  const [isProductListModalVisible, setProductListModalVisible] =
    useState(false);
  const { products } = useGetProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const sortOptions = useMemo(
    () => [
      { label: 'Producto', value: 'name' },
      { label: 'Precio', value: 'price' },
      { label: 'Stock', value: 'stock' },
    ],
    [],
  );

  const invoiceProducts = useMemo<InvoiceProduct[]>(
    () => (Array.isArray(invoice?.products) ? invoice.products : []),
    [invoice],
  );
  const readOnly = isEditLocked;
  const categoryStats = useMemo(
    () => getCategoryStats(invoiceProducts),
    [invoiceProducts],
  );

  const safeCategoryFilter = useMemo(() => {
    if (categoryFilter === 'all') return 'all';
    const hasSelectedCategory = categoryStats.entries.some(
      (entry) => entry.name === categoryFilter,
    );
    return hasSelectedCategory ? categoryFilter : 'all';
  }, [categoryFilter, categoryStats]);

  const displayProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filteredBySearch = normalizedSearch
      ? invoiceProducts.filter((product) => {
        const name = product?.name?.toLowerCase() ?? '';
        return name.includes(normalizedSearch);
      })
      : [...invoiceProducts];

    const filtered =
      safeCategoryFilter === 'all'
        ? filteredBySearch
        : filteredBySearch.filter(
          (product) =>
            getCategoryName(product?.category as CategoryLike) ===
            safeCategoryFilter,
        );

    const directionMultiplier = sortDirection === 'desc' ? -1 : 1;

    const sorted = [...filtered].sort((a, b) => {
      switch (sortField) {
        case 'price':
          return (getTotalPrice(a) - getTotalPrice(b)) * directionMultiplier;
        case 'stock':
          return ((a?.stock ?? 0) - (b?.stock ?? 0)) * directionMultiplier;
        case 'name':
        default:
          return (
            (a?.name ?? '')?.localeCompare(b?.name ?? '') * directionMultiplier
          );
      }
    });

    return sorted;
  }, [invoiceProducts, searchTerm, safeCategoryFilter, sortField, sortDirection]);

  const columns: ColumnsType<InvoiceProduct> = [
    {
      title: 'Producto',
      dataIndex: 'name',
      key: 'productName',
    },
    {
      title: 'Cantidad',
      dataIndex: 'amountToBuy',
      key: 'amountToBuy',
      render: (_value, record) => (
        <Counter>
          <Button
            onClick={() => {
              if (readOnly) {
                message.warning('No puedes modificar productos después de 48 horas.');
                return;
              }
              dispatch(
                changeAmountToBuyProduct({ product: record, type: 'subtract' }),
              );
            }}
            icon={icons.mathOperations.subtract}
            disabled={readOnly}
          />
          <Input
            value={getProductQuantity(record)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              if (readOnly) {
                message.warning('No puedes modificar productos después de 48 horas.');
                return;
              }
              const value = e.target.value;
              const numericValue = toNumber(value, NaN);
              if (Number.isFinite(numericValue)) {
                dispatch(
                  changeAmountToBuyProduct({
                    product: record,
                    amount: numericValue,
                    type: 'change',
                  }),
                );
              }
            }}
            disabled={readOnly}
          />
          <Button
            onClick={() => {
              if (readOnly) {
                message.warning('No puedes modificar productos después de 48 horas.');
                return;
              }
              dispatch(
                changeAmountToBuyProduct({ product: record, type: 'add' }),
              );
            }}
            icon={icons.operationModes.add}
            disabled={readOnly}
          />
        </Counter>
      ),
    },
    {
      title: 'Precio Unitario',
      dataIndex: 'price',
      key: 'unitPrice',
      align: 'left',
      render: (_value, record) => getFormattedUnitPrice(record),
    },
    {
      title: 'Precio Total',
      key: 'totalPrice',
      align: 'left',
      render: (_value, record) => getFormattedTotalPrice(record),
    },
    {
      title: 'Acciones',
      key: 'actions',
      align: 'left',

      render: (_value, record) => (
        <Button
          onClick={() => {
            if (readOnly) {
              message.warning(
                'No puedes modificar productos despu+®s de 48 horas.',
              );
              return;
            }
            dispatch(deleteProductInvoiceForm({ product: record }));
          }}
          icon={icons.operationModes.delete}
          disabled={readOnly}
        />
      ),
    },
  ];
  const paginationSeed = `${searchTerm}|${safeCategoryFilter}|${sortField}|${sortDirection}|${invoiceProducts.length}`;
  const [paginationState, setPaginationState] = useState(() => ({
    seed: paginationSeed,
    current: 1,
    pageSize: 5,
  }));

  const currentPage =
    paginationState.seed === paginationSeed ? paginationState.current : 1;
  const pageSize = paginationState.pageSize;

  const paginationConfig = {
    pageSize,
    current: currentPage,
    position: ['bottomCenter'],
    showSizeChanger: false,
    onChange: (page: number, pageSize: number) => {
      setPaginationState({ seed: paginationSeed, current: page, pageSize });
    },
  };

  const showProductListModal = () => {
    if (readOnly) {
      message.warning('No puedes modificar productos después de 48 horas.');
      return;
    }
    setProductListModalVisible(true);
  };
  const handleAddProduct = (product: InvoiceProduct) => {
    if (readOnly) return;
    dispatch(addProductInvoiceForm({ product }));
    setProductListModalVisible(false);
  };
  return (
    <Container>
      <ActionsContainer>
        <Button
          type="primary"
          onClick={showProductListModal}
          disabled={readOnly}
        >
          Añadir Producto
        </Button>
      </ActionsContainer>
      <ProductFilterToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar producto"
        categoryFilter={safeCategoryFilter}
        onCategoryChange={setCategoryFilter}
        categoryStats={categoryStats}
        sortField={sortField}
        sortOptions={sortOptions}
        onSortFieldChange={setSortField}
        sortDirection={sortDirection}
        onToggleSortDirection={() =>
          setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
        }
      />
      <StyledProductTable
        size="small"
        dataSource={displayProducts}
        columns={columns}
        pagination={paginationConfig}
        rowKey="id"
      />
      <ProductListModal
        isVisible={isProductListModalVisible}
        onClose={() => setProductListModalVisible(false)}
        products={Array.isArray(products) ? products : []}
        onAddProduct={handleAddProduct}
        isReadOnly={readOnly}
      />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1em;
`;
const Counter = styled.div`
  display: grid;
  gap: 1em;
  grid-template-columns: 2em 80px 2em;
`;
const ActionsContainer = styled.div`
  text-align: right; /* Esto alinea tu botón a la derecha */
`;
