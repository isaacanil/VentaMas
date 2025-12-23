import { StopOutlined } from '@ant-design/icons';
import { Divider, Space, Typography } from 'antd';
import styled from 'styled-components';

import { PRODUCT_BRAND_DEFAULT } from '@/features/updateProduct/updateProductSlice';
import { imgFailed } from '@/views/component/modals/ProductForm/ImageManager/ImageManager';

const { Title, Text } = Typography;

const SummaryCard = styled.div`
  position: sticky;
  top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: calc(100vh - 80px);
  padding: 24px;
  overflow: hidden auto;
  background: #fff;
  border: 1px solid #f0f2f5;
  border-radius: 18px;
  box-shadow: 0 8px 24px -10px rgb(15 23 42 / 20%);

  @media (width <= 1200px) {
    position: static;
    top: auto;
    max-height: none;
    overflow: visible;
  }
`;

const SectionDivider = styled(Divider)`
  margin: 8px 0;
  border-color: #e2e8f0;

  &.ant-divider-horizontal {
    margin: 8px 0;
  }
`;

const PreviewImage = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 140px;
  margin: 0 auto;
  overflow: hidden;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;

  &::before {
    display: block;
    padding-top: 100%;
    content: '';
  }

  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PreviewPlaceholder = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #94a3b8;
  text-align: center;
  background: #f8fafc;
`;

const PreviewDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ModesTag = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ $color }) => ($color === 'danger' ? '#b91c1c' : '#0f172a')};
  background: ${({ $color }) => ($color === 'danger' ? '#fee2e2' : '#dbeafe')};
  border-radius: 999px;
`;

const MetricsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MetricRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  span.label {
    font-size: 13px;
    font-weight: 500;
    color: #64748b;
  }

  span.value {
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
  }
`;

export const ProductSummary = ({ product, previewMetrics }) => (
  <SummaryCard>
    <PreviewImage>
      {product?.image ? (
        <img
          src={product.image}
          alt={product?.name || 'Producto'}
          onError={(event) => (event.currentTarget.src = imgFailed)}
        />
      ) : (
        <PreviewPlaceholder>
          <StopOutlined style={{ fontSize: 40 }} />
          <span>Sin imagen seleccionada</span>
        </PreviewPlaceholder>
      )}
    </PreviewImage>

    <PreviewDetails>
      <Title level={4} style={{ margin: '12px 0 0' }}>
        {product?.name || 'Producto sin nombre'}
      </Title>
      <Text type="secondary">
        {product?.brand || PRODUCT_BRAND_DEFAULT} ·{' '}
        {product?.category || 'Sin categoría'}
      </Text>
      <Space size="small" wrap style={{ marginTop: 8 }}>
        <ModesTag $color={previewMetrics.trackInventory ? 'info' : 'warning'}>
          {previewMetrics.trackInventory ? 'Inventariable' : 'Sin inventario'}
        </ModesTag>
        <ModesTag $color={product?.isVisible === false ? 'danger' : 'info'}>
          {product?.isVisible === false ? 'Oculto' : 'Publicado'}
        </ModesTag>
      </Space>
    </PreviewDetails>

    <SectionDivider />
    <MetricsContainer>
      <MetricRow>
        <span className="label">Stock</span>
        <span className="value">{previewMetrics.stock} unidades</span>
      </MetricRow>
      <MetricRow>
        <span className="label">Precio</span>
        <span className="value">RD$ {previewMetrics.price?.toFixed(2)}</span>
      </MetricRow>
      <MetricRow>
        <span className="label">Ganancia</span>
        <span className="value">{previewMetrics.margin}%</span>
      </MetricRow>
    </MetricsContainer>
  </SummaryCard>
);
