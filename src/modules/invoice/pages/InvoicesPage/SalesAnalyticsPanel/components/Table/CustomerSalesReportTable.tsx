import { Table, Typography, Divider, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DateTime } from 'luxon';
import React, { useState } from 'react';
import type { SalesRecord } from '../../utils';
import { getInvoiceDateSeconds, toNumber } from '../../utils';

import { formatNumber } from '@/utils/format';
import { formatPrice } from '@/utils/format';

type CustomerProductRow = {
  nombre?: string;
  precio: number;
  cantidad: number;
  subtotal: number;
};

type CustomerInvoiceRow = {
  numberID?: string | number;
  fecha?: string;
  productos: CustomerProductRow[];
};

type CustomerGroupRow = {
  key: string;
  cliente: string;
  items: number;
  total: number;
  facturas: CustomerInvoiceRow[];
};



const aggregateClientData = (sales: SalesRecord[]) => {
  // Agrupar ventas por cliente
  const groupedByClient = sales.reduce<Record<string, CustomerGroupRow>>((acc, sale) => {
    const clientName = sale.data.client?.name ?? 'Cliente sin nombre';
    if (!acc[clientName]) {
      acc[clientName] = {
        key: String(sale.data.client?.id ?? clientName),
        cliente: clientName,
        items: 0,
        total: 0,
        facturas: [],
      };
    }
    const clientGroup = acc[clientName];
    clientGroup.items += toNumber(sale.data.totalShoppingItems?.value);
    clientGroup.total += toNumber(sale.data.totalPurchase?.value);
    clientGroup.facturas.push({
      numberID: sale.data.numberID,
      fecha: (() => {
        const seconds = getInvoiceDateSeconds(sale.data);
        return seconds ? DateTime.fromSeconds(seconds).toFormat('dd/MM/yyyy') : 'N/A';
      })(),
      productos: (sale.data.products ?? []).map((product) => {
        const taxPercent = toNumber(product.pricing?.tax);
        const price = toNumber(product.pricing?.price);
        const amountToBuy = toNumber(
          typeof product.amountToBuy === 'number'
            ? product.amountToBuy
            : product.amountToBuy?.total ?? product.amountToBuy?.unit,
        );
        const unitPrice = price + price * (taxPercent / 100);

        return {
          nombre: product.name ?? product.productName,
          precio: unitPrice,
          cantidad: amountToBuy,
          subtotal: unitPrice * amountToBuy,
        };
      }),
    });
    return acc;
  }, {});

  // Convertir el objeto agrupado en un array para la tabla
  return Object.values(groupedByClient);
};

const expandedRowRender = (facturas: CustomerInvoiceRow[]) => {
  const productColumns = [
    { title: 'Factura', dataIndex: 'numberID', key: 'numberID' },
    { title: 'Fecha', dataIndex: 'fecha', key: 'fecha' },
    { title: 'Producto', dataIndex: 'nombre', key: 'nombre' },
    {
      title: 'Precio',
      dataIndex: 'precio',
      key: 'precio',
      render: (value) => formatPrice(value),
    },
    {
      title: 'Cantidad',
      dataIndex: 'cantidad',
      key: 'cantidad',
      render: (value) => formatNumber(value),
    },
    {
      title: 'SubTotal',
      dataIndex: 'subtotal',
      key: 'subtotal',
      render: (value) => formatPrice(value),
    },
  ];

  const productData = facturas.flatMap((factura) =>
    factura.productos.map((producto, index) => ({
      key: `${factura.numberID}-${index}`,
      numberID: factura.numberID,
      fecha: factura.fecha,
      ...producto,
    })),
  );

  return (
    <Table
      columns={productColumns}
      dataSource={productData}
      pagination={false}
    />
  );
};

export const CustomerSalesReportTable = ({ sales }: { sales: SalesRecord[] }) => {
  const groupedData = aggregateClientData(sales);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const totalClients = groupedData.length;

  const columns: ColumnsType<CustomerGroupRow> = [
    { title: 'Cliente', dataIndex: 'cliente', key: 'cliente' },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      align: 'right',
      render: (value) => `${formatNumber(value)}`,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      align: 'right',
      render: (value) => `${formatPrice(value)}`,
    },
  ];

  const handleTableChange = (page: number, pageSize: number) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  return (
    <div>
      <Divider orientationMargin={0}>
        <div
          style={{
            display: 'flex',
            gap: '1em',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <Typography.Title level={4} style={{ margin: 0 }}>
            Reporte de venta por cliente
          </Typography.Title>
          <Tag color="orange">Beta</Tag>
        </div>
      </Divider>
      <Table
        className="components-table-demo-nested"
        columns={columns}
        size="small"
        scroll={{ x: 200 }}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          onChange: handleTableChange,
        }}
        expandable={{
          expandedRowRender: (record) => expandedRowRender(record.facturas),
        }}
        dataSource={groupedData}
        summary={(pageData) => {
          let totalItemsSum = 0;
          let totalSalesSum = 0;

          pageData.forEach(({ items, total }) => {
            totalItemsSum += items;
            totalSalesSum += total;
          });

          return (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}></Table.Summary.Cell>
              <Table.Summary.Cell index={1}>
                <div style={{ fontWeight: 700 }}>
                  Total Clientes: {totalClients}
                </div>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2}>
                <div style={{ fontWeight: 700, textAlign: 'right' }}>
                  {totalItemsSum}
                </div>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3}>
                <div style={{ fontWeight: 700, textAlign: 'right' }}>
                  {formatPrice(totalSalesSum)}
                </div>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />
    </div>
  );
};
