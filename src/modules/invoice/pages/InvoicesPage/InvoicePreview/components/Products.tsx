import { Table } from 'antd';
import React from 'react';
import type { InvoiceProduct } from '@/types/invoice';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';
type ProductsProps = {
  products?: InvoiceProduct[];
};


const Products = ({ products = [] }: ProductsProps) => {
  return (
    <div>
      <StyledTitle>Productos</StyledTitle>
      <ProductTable products={products} />
    </div>
  );
};

export default Products;

const StyledTitle = styled.h2`
  margin: 0 0 1em;
  font-size: 1rem;
  font-weight: 600;
`;

const ProductTable = ({ products = [] }: ProductsProps) => {
const resolveQuantity = (product: InvoiceProduct) => {
  if (typeof product.amountToBuy === 'number') return product.amountToBuy;
  if (typeof product.amountToBuy?.total === 'number') return product.amountToBuy.total;
  if (typeof product.amountToBuy?.unit === 'number') return product.amountToBuy.unit;
  return 0;
};

const resolveUnitPrice = (product: InvoiceProduct): number => {
  const raw =
    product.pricing?.price ??
    product.selectedSaleUnit?.pricing?.price ??
    product.price?.unit ??
    0;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : 0;
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
      render: (text: InvoiceProduct["amountToBuy"]) => {
        if (typeof text === "number") return text;
        if (typeof text?.total === "number") return text.total;
        if (typeof text?.unit === "number") return text.unit;
        return "N/A";
      },
    },
    {
      title: 'Precio Unitario',
      dataIndex: ['pricing', 'price'],
      key: 'unitPrice',
      render: (price: number | string | undefined) =>
        formatPrice(Number(price) || 0) ?? 'N/A',
    },
    {
      title: 'Total',
      dataIndex: ['pricing', 'price'],
      key: 'total',
      render: (_: unknown, record: InvoiceProduct) => {
        const quantity = resolveQuantity(record);
        const unitPrice = resolveUnitPrice(record);
        const total = typeof record.price?.total === "number" ? record.price.total : unitPrice * quantity;
        return formatPrice(total) ?? 'N/A';
      },
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
