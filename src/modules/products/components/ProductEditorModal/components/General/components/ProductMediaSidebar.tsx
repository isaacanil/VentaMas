import { Button, Card, Col, Image as AntdImage, Space } from 'antd';

import { imgFailed } from '@/domain/products/productAssets';
import { ProductQRCode } from '@/modules/products/public';
import type { ProductRecord } from '@/types/products';

import { BarCode } from '../../sections/BarCode';
import { WarrantyInfo } from '../../sections/WarrantyInfo';
import {
  Image,
  ImageContainer,
  ImageContent,
} from './ProductMediaSidebar.styles';

interface ProductMediaSidebarProps {
  product: ProductRecord;
  showImageManager: () => void;
}

export const ProductMediaSidebar = ({
  product,
  showImageManager,
}: ProductMediaSidebarProps) => {
  return (
    <Col
      span={8}
      style={{
        display: 'grid',
      }}
    >
      <Space orientation="vertical">
        <Card title="Imagen del producto" size="small">
          <Space
            orientation="vertical"
            style={{
              width: '100%',
            }}
          >
            <ImageContent>
              {product?.image && <AntdImage height={150} src={product.image} />}
              {!product?.image && (
                <ImageContainer>
                  <Image src={imgFailed} />
                </ImageContainer>
              )}
            </ImageContent>

            <Button
              style={{
                width: '100%',
              }}
              onClick={showImageManager}
            >
              {product?.image ? 'Actualizar' : 'Agregar'} imagen
            </Button>
          </Space>
        </Card>
        <ProductQRCode product={product} />
        <BarCode product={product} />
        <WarrantyInfo />
      </Space>
    </Col>
  );
};
