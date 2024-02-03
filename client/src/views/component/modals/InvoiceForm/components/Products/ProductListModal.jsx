import React from 'react';
import * as antd  from 'antd';
const { Modal, Table, Button } = antd;

export const ProductListModal = ({ isVisible, onClose, products, onAddProduct }) => {
  const columns = [
    {
      title: 'Producto',
      dataIndex: ['product', 'productName'],
      key: 'productName',
      sorter: (a, b) => a.product.productName.localeCompare(b.product.productName),
    },
    {
      title: 'Precio Unitario',
      dataIndex: ['product','price'],
      key: 'price',
      render: (price) => `$${price.unit.toFixed(2)}`,
      sorter: (a, b) => a.product.price.unit - b.product.price.unit,
    },
    {
      title: 'Stock',
      dataIndex: ['product','stock'],
      key: 'stock',
      sorter: (a, b) => a.product.stock - b.product.stock,
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (text, record) => (
        <Button onClick={() => onAddProduct(record.product)}>Añadir</Button>
      ),
    }
  ];
  const paginationConfig = {
    pageSize: 5,
    position: ["bottomCenter"]
  }

  return (
    <Modal
      title="Agregar Producto a la Factura"
       open={isVisible}
      onCancel={onClose}
      footer={null}
      
      width={800}
    >
      <Table
        dataSource={products}
        columns={columns}
        pagination={paginationConfig}
        rowKey="id"
      />
    </Modal>
  );
};


