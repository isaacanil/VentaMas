import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  PrinterOutlined,
  CloseOutlined,
} from '@/constants/icons/antd';
import { Button, Dropdown } from 'antd';
import React, { useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { store } from '@/app/store';
import { icons } from '@/constants/icons/icons';
import { OPERATION_MODES } from '@/constants/modes';
import { useDialog } from '@/Context/Dialog/useDialog';
import { selectUser } from '@/features/auth/userSlice';
import { toggleBarcodeModal } from '@/features/barcodePrintModalSlice/barcodePrintModalSlice';
import { openModalUpdateProd } from '@/features/modals/modalSlice';
import { selectTaxReceiptEnabled } from '@/features/taxReceipt/taxReceiptSlice';
import { ChangeProductData } from '@/features/updateProduct/updateProductSlice';
import { fbDeleteProduct } from '@/firebase/products/fbDeleteproduct';
import { filterData } from '@/hooks/search/useSearch';
import { formatPrice } from '@/utils/format';
import { formatNumber } from '@/utils/format';
import { getTax, getTotalPrice } from '@/utils/pricing';
import { ProductCategoryBar } from '@/modules/products/components/ProductCategoryBar/ProductCategoryBar';
import { AdvancedTable } from '@/components/ui/AdvancedTable/AdvancedTable';
import { ImgCell } from '@/components/ui/AdvancedTable/components/Cells/Img/ImgCell';
import { ButtonGroup } from '@/components/ui/Button/Button';
import StockIndicator from '@/components/ui/labels/StockIndicator';
import type { AdvancedTableProps } from '@/components/ui/AdvancedTable/AdvancedTable';
import type { ProductRecord } from '@/types/products';

type ProductTableProps = {
  products: ProductRecord[];
  searchTerm: string;
};

type ProductRow = {
  id?: string;
  image?: string;
  name: { name?: string; img?: string };
  stock: { stock?: number; trackInventory?: boolean };
  trackInventory?: boolean;
  cost?: number;
  price: ProductRecord;
  tax?: number;
  isVisible?: boolean;
  action: ProductRecord;
  category?: string;
};

type ProductDeletionTarget = ProductRecord & { product?: ProductRecord };

type ScrollMetrics = { isAtBottom?: boolean };

export const ProductsTable = ({ products, searchTerm }: ProductTableProps) => {
  const dispatch = useDispatch();
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled) as boolean;
  const { setDialogConfirm } = useDialog();
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [totalsDismissed, setTotalsDismissed] = useState(false);

  const handleDeleteProduct = useCallback(
    (value: ProductDeletionTarget) => {
      const docId = value?.product?.id ?? value?.id;
      if (!docId) return;
      setDialogConfirm({
        title: 'Eliminar producto',
        isOpen: true,
        type: 'error',
        message: '¿Está seguro que desea eliminar este producto?',
        onConfirm: async () => {
          const currentUser = selectUser(store.getState());
          await fbDeleteProduct(currentUser, docId);
        },
      });
    },
    [setDialogConfirm],
  );

  const handleUpdateProduct = (product: ProductRecord) => {
    dispatch(openModalUpdateProd());
    dispatch(
      ChangeProductData({
        product: product,
        status: OPERATION_MODES.UPDATE.label,
      }),
    );
  };

  const columns: AdvancedTableProps<ProductRow>['columns'] = [
    {
      Header: 'Nombre',
      accessor: 'name',
      reorderable: false,
      minWidth: '300px',
      maxWidth: '1fr',
      sortable: true,
      sortableValue: (value) => (value as ProductRow['name'])?.name,
      cell: ({ value }) => {
        const nameValue = value as ProductRow['name'];
        return (
          <ProductName>
            <ImgCell img={nameValue?.img} />
            <span>{nameValue?.name}</span>
          </ProductName>
        );
      },
    },
    {
      Header: 'Stock',
      accessor: 'stock',
      align: 'right',
      sortable: true,
      sortableValue: (value) => (value as ProductRow['stock'])?.stock,
      minWidth: '80px',
      maxWidth: '140px',
      cell: ({ value }) => {
        const stockValue = value as ProductRow['stock'];
        return (
          <StockIndicator
            stock={formatNumber(Number(stockValue?.stock ?? 0))}
            trackInventory={stockValue?.trackInventory}
          ></StockIndicator>
        );
      },
    },
    {
      Header: 'Costo',
      align: 'right',
      sortable: true,
      accessor: 'cost',
      minWidth: '120px',
      maxWidth: '0.4fr',
      cell: ({ value }) => (
        <div>{formatPrice(typeof value === 'number' ? value : 0)}</div>
      ),
    },
    {
      Header: 'Impuesto',
      sortable: true,
      align: 'right',
      minWidth: '120px',
      maxWidth: '0.4fr',
      accessor: 'tax',
      cell: ({ value }) => (
        <div>{formatPrice(typeof value === 'number' ? value : 0)}</div>
      ),
    },
    {
      Header: 'Precio',
      sortable: true,
      accessor: 'price',
      minWidth: '120px',
      maxWidth: '0.4fr',
      align: 'right',
      cell: ({ value }) => {
        const product = value as ProductRecord;
        const price = getTotalPrice(product, taxReceiptEnabled);
        const unit = product?.weightDetail?.weightUnit;
        const isSoldByWeight = product?.weightDetail?.isSoldByWeight;
        if (isSoldByWeight) {
          return (
            <div>
              {formatPrice(price)} / {unit}
            </div>
          );
        }
        return formatPrice(price);
      },
    },
    {
      Header: 'Facturable',
      accessor: 'isVisible',
      minWidth: '100px',
      maxWidth: '100px',
      align: 'center',
      cell: ({ value }) => (
        <div>{value === false && icons.operationModes.hide}</div>
      ),
    },
    {
      Header: 'Acción',
      accessor: 'action',
      reorderable: false,
      minWidth: '100px',
      maxWidth: '100px',
      align: 'right',
      clickable: false,
      cell: ({ value }) => {
        const product = value as ProductRecord;
        const menu = {
          items: [
            {
              label: 'Editar',
              key: 1,
              icon: <EditOutlined />,
              onClick: () => handleUpdateProduct(product),
            },
            {
              label: 'Imprimir Barcode',
              key: 2,
              icon: <PrinterOutlined />,
              onClick: () => dispatch(toggleBarcodeModal(product)),
            },
            {
              label: 'Eliminar',
              key: 3,
              icon: <DeleteOutlined />,
              danger: true,
              onClick: () => handleDeleteProduct(product),
            },
          ],
        };

        return (
          <ButtonGroup>
            <Dropdown menu={menu}>
              <Button icon={<MoreOutlined />} />
            </Dropdown>
          </ButtonGroup>
        );
      },
    },
  ];

  const data: ProductRow[] = products.map((product) => ({
    id: product.id,
    image: product.image,
    name: { name: product.name, img: product.image },
    stock: { stock: product.stock, trackInventory: product.trackInventory },
    trackInventory: product.trackInventory,
    cost: product?.pricing?.cost,
    price: product,
    tax: getTax(product),
    isVisible: product?.isVisible,
    action: product,
    category: product.category,
  }));

  // Totales (filtrados por el término de búsqueda actual)
  const filteredProducts = useMemo<ProductRecord[]>(
    () => filterData(products, searchTerm) ?? [],
    [products, searchTerm],
  );
  const totals = useMemo(() => {
    let stock = 0;
    let cost = 0;
    let listPrice = 0;
    for (const p of filteredProducts) {
      const qty = Number(p?.stock) || 0;
      const unitCost = Number(p?.pricing?.cost) || 0;
      // Preferir listPrice; si no hay, usar price como aproximación
      const unitListPrice =
        typeof p?.pricing?.listPrice === 'number' ? p.pricing.listPrice : 0;
      stock += qty;
      cost += qty * unitCost;
      listPrice += qty * unitListPrice;
    }
    return { stock, cost, listPrice };
  }, [filteredProducts]);

  // Recibe métricas de scroll del cuerpo de la tabla para ocultar la píldora al llegar abajo
  const handleScrollMetrics = useCallback((metrics: ScrollMetrics) => {
    setIsAtBottom(!!metrics?.isAtBottom);
  }, []);

  return (
    <>
      <AdvancedTable
        data={data}
        columns={columns}
        searchTerm={searchTerm}
        headerComponent={<ProductCategoryBar />}
        tableName={'inventory_items_table'}
        elementName={'productos'}
        onRowClick={(row) => handleUpdateProduct(row.action)}
        groupBy={'category'}
        onScrollMetrics={handleScrollMetrics}
      />
      <FloatingTotals $hidden={isAtBottom || totalsDismissed}>
        <TotalsContainer>
          <span>Stock: {formatNumber(totals.stock)}</span>
          <Divider>|</Divider>
          <span>Costo: {formatPrice(totals.cost)}</span>
          <Divider>|</Divider>
          <span>Precio lista: {formatPrice(totals.listPrice)}</span>
          <CloseButton
            type="text"
            size="small"
            aria-label="Ocultar totales"
            onClick={() => setTotalsDismissed(true)}
            icon={<CloseOutlined />}
          />
        </TotalsContainer>
      </FloatingTotals>
    </>
  );
};
const ProductName = styled.div`
  display: flex;
  gap: 1.2em;
  align-items: center;
  height: 100%;
`;

// Totales en el pie de tabla
const TotalsContainer = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
  font-weight: 600;
  white-space: nowrap;
`;

const Divider = styled.span`
  color: var(--gray6);
`;

// Píldora flotante con totales
const FloatingTotals = styled.div<{ $hidden?: boolean }>`
  position: fixed;
  right: 16px;
  bottom: 50px;
  z-index: 1000;
  padding: 8px 12px;
  pointer-events: ${(p: { $hidden?: boolean }) => (p.$hidden ? 'none' : 'auto')};
  background: rgb(255 255 255 / 92%);
  border: 1px solid rgb(0 0 0 / 8%);
  border-radius: 999px;
  box-shadow: 0 6px 16px rgb(0 0 0 / 12%);
  opacity: ${(p: { $hidden?: boolean }) => (p.$hidden ? 0 : 1)};
  backdrop-filter: blur(6px);
  transform: translateY(${(p: { $hidden?: boolean }) => (p.$hidden ? '8px' : '0')});
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;

  @media (width <= 600px) {
    right: 8px;
    bottom: 8px;
    padding: 6px 10px;
    font-size: 12px;
  }
`;

// Botón de cerrar con estilo mínimo (reutiliza antd Button)
const CloseButton = styled(Button)`
  margin-left: 8px;
  color: var(--gray6);

  &.ant-btn:hover {
    color: var(--gray3);
  }
`;
