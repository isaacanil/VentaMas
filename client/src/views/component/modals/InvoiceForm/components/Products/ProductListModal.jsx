import React from 'react';
import * as antd  from 'antd';
import { getTotalPrice } from '../../../../../../utils/pricing';
import { useFormatPrice } from '../../../../../../hooks/useFormatPrice';
const { Modal, Table, Button } = antd;

export const ProductListModal = ({ isVisible, onClose, products, onAddProduct }) => {
  const columns = [
    {
      title: 'Producto',
      dataIndex: [ 'name'],
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Precio Unitario',
      dataIndex: ['pricing', 'price'],
      key: 'price',
      render: (text, record) => useFormatPrice(getTotalPrice(record)),
      sorter: (a, b) => {
    
      const totalPriceA = getTotalPrice(a)
      const totalPriceB = getTotalPrice(b)
      

        return totalPriceA - totalPriceB
        
      },
    },
    {
      title: 'Stock',
      dataIndex: ['stock'],
      key: 'stock',
      sorter: (a, b) => a.stock - b.stock,
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (text, record) => (
        <Button onClick={() => onAddProduct(record)}>Añadir</Button>
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


