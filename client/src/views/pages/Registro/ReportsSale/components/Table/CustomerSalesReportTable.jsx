import React, { useState } from 'react';
import * as antd from 'antd';
import dayjs from 'dayjs';
import { useFormatPrice } from '../../../../../../hooks/useFormatPrice';

const { Table, Typography, Divider } = antd;

const aggregateClientData = (sales) => {
  // Agrupar ventas por cliente
  const groupedByClient = sales.reduce((acc, sale) => {
    const clientName = sale.data.client.name;
    if (!acc[clientName]) {
      acc[clientName] = {
        key: sale.data.client.id, // Asumiendo que el ID del cliente es único
        cliente: clientName,
        items: 0,
        total: 0,
        facturas: [],
      };
    }
    const clientGroup = acc[clientName];
    clientGroup.items += sale.data.totalShoppingItems.value;
    clientGroup.total += sale.data.totalPurchase.value;
    clientGroup.facturas.push({
      numberID: sale.data.numberID,
      fecha: dayjs.unix(sale.data.date.seconds).format("DD/MM/YYYY"),
      productos: sale.data.products.map(product => ({
        nombre: product.productName,
        precio: product.price.unit,
        cantidad: product.amountToBuy.total,
        subtotal: product.price.total,
      })),
    });
    return acc;
  }, {});

  // Convertir el objeto agrupado en un array para la tabla
  return Object.values(groupedByClient);
};

const expandedRowRender = (facturas) => {
  const productColumns = [
    { title: 'Factura', dataIndex: 'numberID', key: 'numberID' },
    { title: 'Fecha', dataIndex: 'fecha', key: 'fecha' },
    { title: 'Producto', dataIndex: 'nombre', key: 'nombre' },
    { title: 'Precio', dataIndex: 'precio', key: 'precio' },
    { title: 'Cantidad', dataIndex: 'cantidad', key: 'cantidad' },
    { title: 'SubTotal', dataIndex: 'subtotal', key: 'subtotal' },
  ];

  const productData = facturas.flatMap(factura =>
    factura.productos.map((producto, index) => ({
      key: `${factura.numberID}-${index}`,
      numberID: factura.numberID,
      fecha: factura.fecha,
      ...producto,
    }))
  );

  return <Table columns={productColumns} dataSource={productData} pagination={false} />;
};

export const CustomerSalesReportTable = ({ sales }) => {
  const groupedData = aggregateClientData(sales);
  const [pageSize, setPageSize] = useState(20); 
  const [currentPage, setCurrentPage] = useState(1); 
  // Calcular totales
  const totalItems = groupedData.reduce((sum, record) => sum + record.items, 0);
  const totalSales = groupedData.reduce((sum, record) => sum + record.total, 0);
  const totalClients = groupedData.length;

  const columns = [
    { title: 'Cliente', dataIndex: 'cliente', key: 'cliente' },
    { title: 'Items', dataIndex: 'items', key: 'items' },
    { title: 'Total', dataIndex: 'total', key: 'total', render: text => `$${text.toFixed(2)}` },
  ];
 
  const handleTableChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };
  
  return (
    <div>

      <Divider orientation='left' orientationMargin={false}>
        <div style={{ display: 'flex', gap: "1em", alignItems: 'center', marginBottom: '20px' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>Reporte de venta por cliente</Typography.Title>
          <antd.Tag color="orange">Beta</antd.Tag>
        </div>
      </Divider>
      <Table
        className="components-table-demo-nested"
        columns={columns}
        size='small'
        scroll={{ x: 200 }}
        pagination={{ 
          current: currentPage,
          pageSize: pageSize,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          onChange: handleTableChange
         }}
        expandable={{ expandedRowRender: record => expandedRowRender(record.facturas) }}
        dataSource={groupedData}
        summary={pageData => {
          let totalItemsSum = 0;
          let totalSalesSum = 0;

          pageData.forEach(({ items, total }) => {
            totalItemsSum += items;
            totalSalesSum += total;
          });

          return (
            <Table.Summary.Row>
               <Table.Summary.Cell index={0}></Table.Summary.Cell>
              <Table.Summary.Cell index={1}><div style={{fontWeight: 700,}}>Total Clientes: {totalClients}</div></Table.Summary.Cell>
              <Table.Summary.Cell index={2}><div style={{fontWeight: 700,}}>{totalItemsSum}</div></Table.Summary.Cell>
              <Table.Summary.Cell index={3}>
              <div style={{fontWeight: 700,}}>
                {useFormatPrice(totalSalesSum)}
                </div>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />
    </div>
  );
};


