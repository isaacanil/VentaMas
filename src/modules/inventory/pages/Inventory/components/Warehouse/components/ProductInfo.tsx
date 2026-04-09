import { faBox, faBarcode, faTag } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Card, Descriptions, Skeleton } from 'antd';
import styled from 'styled-components';

type ProductInfoData = {
  name?: string | null;
  sku?: string | null;
  category?: string | null;
};

interface ProductInfoProps {
  product?: ProductInfoData | null;
  loading?: boolean;
}

const ProductCard = styled(Card)`
  margin-bottom: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);

  .ant-card-head-title {
    display: flex;
    gap: 8px;
    align-items: center;
  }
`;

const ProductInfo = ({ product, loading }: ProductInfoProps) => {
  if (loading) return <Skeleton active />;
  if (!product) return null;

  return (
    <ProductCard
      title={
        <>
          <FontAwesomeIcon icon={faBox} />
          {product.name || ''}
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
