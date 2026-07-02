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
  isService?: boolean;
  isRawMaterial?: boolean;
  product: ProductRecord;
  showImageManager: () => void;
}

export const ProductMediaSidebar = ({
  isService = false,
  isRawMaterial = false,
  product,
  showImageManager,
}: ProductMediaSidebarProps) => {
  return (
    <Col
      xs={24}
      lg={8}
      style={{
        display: 'grid',
        minWidth: 0,
      }}
    >
      <Space orientation="vertical" style={{ maxWidth: '100%', minWidth: 0, width: '100%' }}>
        <Card
          title={
            isService
              ? 'Imagen del servicio'
              : isRawMaterial
                ? 'Imagen de la materia prima'
                : 'Imagen del producto'
          }
          size="small"
        >
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
        {!isService && !isRawMaterial ? (
          <>
            <ProductQRCode product={product} />
            <BarCode product={product} />
            <WarrantyInfo />
          </>
        ) : null}
      </Space>
    </Col>
  );
};
