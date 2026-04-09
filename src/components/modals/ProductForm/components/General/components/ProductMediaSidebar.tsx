import { Button, Card, Col, Image as AntdImage, Space } from 'antd';
import styled from 'styled-components';

import { BarCode } from '@/components/modals/ProductForm/components/sections/BarCode';
import { QRCode } from '@/components/modals/ProductForm/components/sections/QRCode';
import { WarrantyInfo } from '@/components/modals/ProductForm/components/sections/WarrantyInfo';
import { imgFailed } from '@/components/modals/ProductForm/ImageManager/ImageManager';
import type { ProductRecord } from '@/types/products';

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
        <QRCode product={product} />
        <BarCode product={product} />
        <WarrantyInfo />
      </Space>
    </Col>
  );
};

const ImageContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 150px;
  overflow: hidden;
  border-radius: 5px;
`;

const ImageContainer = styled.div`
  width: 100%;
  height: 100%;
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
`;
