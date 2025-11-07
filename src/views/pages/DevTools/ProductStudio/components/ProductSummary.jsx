import { StopOutlined } from '@ant-design/icons';
import { Divider, Space, Typography } from 'antd';
import styled from 'styled-components';

import { PRODUCT_BRAND_DEFAULT } from '../../../../../features/updateProduct/updateProductSlice';
import { imgFailed } from '../../../../component/modals/ProductForm/ImageManager/ImageManager';

const { Title, Text } = Typography;

const SummaryCard = styled.div`
  position: sticky;
  top: 16px;
  border-radius: 18px;
  border: 1px solid #f0f2f5;
  box-shadow: 0 8px 24px -10px rgba(15, 23, 42, 0.2);
  padding: 24px;
  background: #fff;
  max-height: calc(100vh - 80px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 1200px) {
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
  width: 100%;
  height: 180px;
  border-radius: 14px;
  overflow: hidden;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PreviewPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 13px;
  text-align: center;
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
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ $color }) => ($color === 'danger' ? '#b91c1c' : '#0f172a')};
  background: ${({ $color }) => ($color === 'danger' ? '#fee2e2' : '#dbeafe')};
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
`;

const Metric = styled.div`
  padding: 10px 12px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;

  span.label {
    display: block;
    font-size: 11px;
    text-transform: uppercase;
    color: #94a3b8;
    letter-spacing: 0.08em;
    margin-bottom: 4px;
  }

  span.value {
    font-size: 18px;
    font-weight: 600;
    color: #0f172a;
  }
`;

const InventoryBlock = styled.div`
  display: flex;
  flex-direction: column;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 16px;
  gap: 4px;

  span.label {
    font-size: 12px;
    text-transform: uppercase;
    color: #94a3b8;
    letter-spacing: 0.08em;
  }

  span.value {
    font-size: 20px;
    font-weight: 600;
    color: #0f172a;
  }
`;

export const ProductSummary = ({ product, previewMetrics }) => (
  <SummaryCard>
    <PreviewImage>
      {product?.image ? (
        <img src={product.image} alt={product?.name || 'Producto'} onError={(event) => (event.currentTarget.src = imgFailed)} />
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
        {product?.brand || PRODUCT_BRAND_DEFAULT} · {product?.category || 'Sin categoría'}
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
    <InventoryBlock>
      <span className="label">Stock</span>
      <span className="value">{previewMetrics.stock} unidades</span>
    </InventoryBlock>
    <MetricsGrid>
      <Metric>
        <span className="label">Precio</span>
        <span className="value">RD$ {previewMetrics.price?.toFixed(2)}</span>
      </Metric>
      <Metric>
        <span className="label">Margen</span>
        <span className="value">{previewMetrics.margin}%</span>
      </Metric>
    </MetricsGrid>
  </SummaryCard>
);
