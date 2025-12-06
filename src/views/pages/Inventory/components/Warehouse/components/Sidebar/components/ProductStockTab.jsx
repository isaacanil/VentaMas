import { SearchOutlined } from '@ant-design/icons';
import { faBoxes, faEye } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Input, Empty, Spin } from 'antd';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import Tree from '../../../../../../../component/tree/Tree';

const TabContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  padding: 16px;
`;

const ProductList = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
`;

const ProductStockTab = ({ products, loading, onSearch }) => {
  const navigate = useNavigate();

  const productTreeConfig = {
    actions: [
      {
        name: 'Ver Stock',
        icon: faEye,
        type: 'button',
        handler: (node) => {
          navigate(`/inventory/warehouses/product/${node.key}/stock`);
        },
      },
    ],
    onNodeClick: (node) => {
      navigate(`/inventory/warehouses/product/${node.key}/stock`);
    },
    showMatchedStockCount: false,
    showActions: true,
    searchPlaceholder: 'Buscar productos en stock...',
  };

  const buildTreeData = () => {
    return products.map((product) => ({
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{product.name}</span>
          {product.barcode && (
            <span style={{ color: '#999', fontSize: '0.85em' }}>
              #{product.barcode}
            </span>
          )}
        </div>
      ),
      key: product.id,
      icon: <FontAwesomeIcon icon={faBoxes} style={{ color: '#2563eb' }} />,
      data: product, // Pasar el producto completo como data
    }));
  };

  return (
    <TabContent>
      <Input
        placeholder="Buscar productos..."
        prefix={<SearchOutlined />}
        onChange={(e) => onSearch(e.target.value)}
      />
      <ProductList>
        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Spin size="large" />
          </div>
        ) : products.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Empty description="No se encontraron productos" />
          </div>
        ) : (
          <Tree data={buildTreeData()} config={productTreeConfig} />
        )}
      </ProductList>
    </TabContent>
  );
};

export default ProductStockTab;
