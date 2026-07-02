import { StopOutlined } from '@/constants/icons/antd';
import { Divider, Image, Space, Typography } from 'antd';
import styled from 'styled-components';

import { PRODUCT_BRAND_DEFAULT } from '@/domain/products/productDefaults';
import { imgFailed } from '@/domain/products/productAssets';
import type {
  ProductPreviewMetrics,
  ProductSnapshot,
} from '@/modules/dev/pages/DevTools/ProductStudio/hooks/useProductPreviewMetrics';

const { Title, Text } = Typography;

const SummaryCard = styled.div`
  position: sticky;
  top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  width: 110px;
  height: 110px;
  margin: 0 auto;
  overflow: hidden;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;

  .ant-image, 
  .ant-image-img {
    display: block;
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
  gap: 4px;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  line-height: 1.2;
  color: #94a3b8;
  text-align: center;
  background: #f8fafc;
`;

const PreviewDetails = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
`;

interface ModesTagProps {
  $color?: 'danger' | 'info' | 'warning';
}

const ModesTag = styled.span<ModesTagProps>`
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
  gap: 2px;
`;

const MetricRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  span.label {
    font-size: 13px;
    font-weight: 500;
    color: #64748b;
  }

  span.value {
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
    background: #f8fafc;
    padding: 2px 8px;
    border-radius: 8px;
  }
`;

interface ProductSummaryProps {
  product?: ProductSnapshot | null;
  previewMetrics: ProductPreviewMetrics;
}

const isComponentTrackedCombo = (product?: ProductSnapshot | null): boolean =>
  product?.itemType === 'combo' &&
  (product.combo?.inventoryPolicy ?? 'components') === 'components';

const isRawMaterial = (product?: ProductSnapshot | null): boolean =>
  product?.itemType === 'product' && product.inventoryRole === 'raw_material';

const getInventoryModeLabel = (
  product: ProductSnapshot | null | undefined,
  previewMetrics: ProductPreviewMetrics,
) => {
  if (isRawMaterial(product)) return 'Materia prima';
  if (product?.itemType === 'service') return 'Servicio';
  if (isComponentTrackedCombo(product)) return 'Combo por receta';
  return previewMetrics.trackInventory ? 'Inventariable' : 'Sin inventario';
};

const getStockValueLabel = (
  product: ProductSnapshot | null | undefined,
  previewMetrics: ProductPreviewMetrics,
) => {
  if (product?.itemType === 'service') return 'No aplica';
  if (isComponentTrackedCombo(product)) return 'Por componentes';
  return `${previewMetrics.stock} unidades`;
};

const getItemTypeLabel = (product: ProductSnapshot | null | undefined) => {
  if (isRawMaterial(product)) return 'Materia prima';
  if (product?.itemType === 'service') return 'Servicio';
  if (product?.itemType === 'combo') return 'Combo';
  return product?.type || 'Producto';
};

const getNameFallback = (product: ProductSnapshot | null | undefined) => {
  if (isRawMaterial(product)) return 'Materia prima sin nombre';
  if (product?.itemType === 'service') return 'Servicio sin nombre';
  if (product?.itemType === 'combo') return 'Combo sin nombre';
  return 'Producto sin nombre';
};

const getSecondaryDescription = (
  product: ProductSnapshot | null | undefined,
) => {
  const itemTypeLabel = getItemTypeLabel(product);
  const category = product?.category || 'Sin categoría';

  if (product?.itemType === 'service' || product?.itemType === 'combo') {
    return `${category} · ${itemTypeLabel}`;
  }

  return `${product?.brand || PRODUCT_BRAND_DEFAULT} · ${category} · ${itemTypeLabel}`;
};

export const ProductSummary: React.FC<ProductSummaryProps> = ({
  product,
  previewMetrics,
}) => {
  const rawMaterial = isRawMaterial(product);

  return (
    <SummaryCard>
    <PreviewImage>
      {product?.image ? (
        <Image
          src={product.image}
          alt={product?.name || getNameFallback(product)}
          fallback={imgFailed}
          preview={{ mask: 'Previsualizar' }}
        />
      ) : (
        <PreviewPlaceholder>
          <StopOutlined style={{ fontSize: 28 }} />
          <span>Sin imagen</span>
        </PreviewPlaceholder>
      )}
    </PreviewImage>

    <PreviewDetails>
      <Title level={4} style={{ margin: 0 }}>
        {product?.name || getNameFallback(product)}
      </Title>
      <Text type="secondary">{getSecondaryDescription(product)}</Text>
      <Space size="small" wrap style={{ marginTop: 4, justifyContent: 'center' }}>
        <ModesTag $color={previewMetrics.trackInventory ? 'info' : 'warning'}>
          {getInventoryModeLabel(product, previewMetrics)}
        </ModesTag>
        <ModesTag
          $color={
            rawMaterial || product?.isVisible === false ? 'danger' : 'info'
          }
        >
          {rawMaterial
            ? 'No vendible'
            : product?.isVisible === false
              ? 'Oculto'
              : 'Publicado'}
        </ModesTag>
      </Space>
    </PreviewDetails>

    <SectionDivider />
    <MetricsContainer>
      <MetricRow>
        <span className="label">Stock</span>
        <span className="value">
          {getStockValueLabel(product, previewMetrics)}
        </span>
      </MetricRow>
      <MetricRow>
        <span className="label">{rawMaterial ? 'Costo' : 'Precio'}</span>
        <span className="value">
          {previewMetrics.currencyMarker}{' '}
          {(rawMaterial
            ? previewMetrics.cost
            : previewMetrics.price
          )?.toFixed(2)}
        </span>
      </MetricRow>
      <MetricRow>
        <span className="label">{rawMaterial ? 'Venta' : 'Ganancia'}</span>
        <span className="value">
          {rawMaterial ? 'No aplica' : `${previewMetrics.margin}%`}
        </span>
      </MetricRow>
    </MetricsContainer>
    </SummaryCard>
  );
};
