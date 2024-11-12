import React from 'react';
import { Table, Button, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const ProductsTable = ({ products, removeProduct, onEditProduct, showProductModal }) => {
  const columns = [
    { title: 'Producto', dataIndex: 'productName' },
    { title: 'Cantidad', dataIndex: 'quantity' },
    { title: 'Unidad', dataIndex: 'unitMeasure' },
    { title: 'Costo Base', dataIndex: 'baseCost' },
    { title: 'ITBIS', dataIndex: 'calculatedITBIS' },
    { title: 'Flete', dataIndex: 'freight' },
    { title: 'Otros Costos', dataIndex: 'otherCosts' },
    { title: 'Costo Unitario', dataIndex: 'unitCost' },
    { title: 'SubTotal', dataIndex: 'subTotal' },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record, index) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => onEditProduct({ ...record, index })}
          />
          <Button 
            icon={<DeleteOutlined />} 
            danger 
            onClick={() => removeProduct(index)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Button 
        type="primary" 
        icon={<PlusOutlined />} 
        onClick={() => showProductModal()}
        style={{ marginBottom: 16 }}
      >
        Agregar Producto
      </Button>
      <Table 
        columns={columns} 
        dataSource={products.map((product, index) => ({
          ...product,
          calculatedITBIS: (product.baseCost * product.taxRate) / 100,
          unitCost: product.baseCost + (product.baseCost * product.taxRate) / 100 + product.freight + product.otherCosts,
          subTotal: (product.baseCost + (product.baseCost * product.taxRate) / 100 + product.freight + product.otherCosts) * product.quantity,
          key: index
        }))} 
        rowKey={(record, index) => index}
      />
    </div>
  );
};

export default ProductsTable;