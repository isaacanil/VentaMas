import { Table } from 'antd';
import React from 'react';
import type { InvoiceData, InvoiceProduct } from '@/types/invoice';
import styled from 'styled-components';
import {
  resolveInvoiceDisplayedTotal,
  resolveInvoiceDisplayedUnitPrice,
} from '@/utils/accounting/lineMonetary';

import { formatInvoicePrice } from '@/utils/invoice/documentCurrency';
type ProductsProps = {
  products?: InvoiceProduct[];
  invoiceData?: InvoiceData | null;
};

const EMPTY_PRODUCTS: InvoiceProduct[] = [];

const Products = ({
  products = EMPTY_PRODUCTS,
  invoiceData = null,
}: ProductsProps) => {
  return (
    <div>
      <StyledTitle>Productos</StyledTitle>
      <ProductTable products={products} invoiceData={invoiceData} />
    </div>
  );
};

export default Products;

const StyledTitle = styled.h2`
  margin: 0 0 1em;
  font-size: 1rem;
  font-weight: 600;
`;

type ProductTableProps = {
  products: InvoiceProduct[];
  invoiceData?: InvoiceData | null;
};

const ProductTable = ({ products, invoiceData = null }: ProductTableProps) => {
  const formatAmount = (value: number | string | null | undefined) =>
    formatInvoicePrice(value, invoiceData);
  const resolveQuantity = (product: InvoiceProduct) => {
    if (typeof product.amountToBuy === 'number') return product.amountToBuy;
    if (typeof product.amountToBuy?.total === 'number')
      return product.amountToBuy.total;
    if (typeof product.amountToBuy?.unit === 'number')
      return product.amountToBuy.unit;
    return 0;
  };

  const columns = [
    {
      title: 'Descripción',
      dataIndex: 'name',
      key: 'name',
      render: (text) => text ?? 'Producto Desconocido',
    },
    {
      title: 'Cantidad',
      dataIndex: 'amountToBuy',
      key: 'amountToBuy',
      render: (text: InvoiceProduct['amountToBuy']) => {
        if (typeof text === 'number') return text;
        if (typeof text?.total === 'number') return text.total;
        if (typeof text?.unit === 'number') return text.unit;
        return 'N/A';
      },
    },
    {
      title: 'Precio Unitario',
      dataIndex: ['pricing', 'price'],
      key: 'unitPrice',
      render: (_price: number | string | undefined, record: InvoiceProduct) =>
        formatAmount(resolveInvoiceDisplayedUnitPrice(record, invoiceData)),
    },
    {
      title: 'Total',
      dataIndex: ['pricing', 'price'],
      key: 'total',
      render: (_: unknown, record: InvoiceProduct) =>
        formatAmount(resolveInvoiceDisplayedTotal(record, invoiceData, true)),
    },
    // Agrega aquí más columnas si necesitas
  ];

  // Transformar datos de productos para cumplir con la estructura esperada por Ant Design Table
  const dataSource = products.map((product, index) => ({
    key: index,
    ...product,
  }));

  return <Table size="small" columns={columns} dataSource={dataSource} />;
};
