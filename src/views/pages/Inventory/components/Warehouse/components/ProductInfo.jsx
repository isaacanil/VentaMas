import { faBox, faBarcode, faTag } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Card, Descriptions, Skeleton } from 'antd';
import React from 'react';
import styled from 'styled-components';

const ProductCard = styled(Card)`
  margin-bottom: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);

  .ant-card-head-title {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const ProductInfo = ({ product, loading }) => {
  if (loading) return <Skeleton active />;
  if (!product) return null;

  return (
    <ProductCard
      title={
        <>
          <FontAwesomeIcon icon={faBox} />
          {product.name}
        </>
      }
    >
      <Descriptions column={2}>
        <Descriptions.Item label="SKU">
          <FontAwesomeIcon icon={faBarcode} style={{ marginRight: '8px' }} />
          {product.sku || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Categoría">
          <FontAwesomeIcon icon={faTag} style={{ marginRight: '8px' }} />
          {product.category || 'N/A'}
        </Descriptions.Item>
        {/* Añade más detalles según necesites */}
      </Descriptions>
    </ProductCard>
  );
};

export default ProductInfo;
