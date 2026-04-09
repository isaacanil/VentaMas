import {
  Form,
  Button,
  Spin,
  Space,
  Row,
  Col,
} from 'antd';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { ProductMediaSidebar } from '@/components/modals/ProductForm/components/General/components/ProductMediaSidebar';
import { useGeneralProductForm } from '@/components/modals/ProductForm/components/General/hooks/useGeneralProductForm';
import {
  selectUpdateProductData,
} from '@/features/updateProduct/updateProductSlice';
import { BarCode } from '@/components/modals/ProductForm/components/sections/BarCode';
import { InventoryInfo } from '@/components/modals/ProductForm/components/sections/InventoryInfo';
import { PriceCalculator } from '@/components/modals/ProductForm/components/sections/PriceCalculator';
import { PriceInfo } from '@/components/modals/ProductForm/components/sections/PriceInfo';
import { ProductInfo } from '@/components/modals/ProductForm/components/sections/ProductInfo';
import { QRCode } from '@/components/modals/ProductForm/components/sections/QRCode';
import { WarrantyInfo } from '@/components/modals/ProductForm/components/sections/WarrantyInfo';
import type { ProductRecord } from '@/types/products';

type GeneralProps = {
  showImageManager: () => void;
};

export const General = ({ showImageManager }: GeneralProps) => {
  const { product } = useSelector(selectUpdateProductData) as {
    product: ProductRecord;
  };
  const {
    form,
    handleChangeValues,
    handleFormKeyDown,
    handleReset,
    onFinish,
    productBrands,
    spinnerIndicator,
    submit,
    submitLabel,
  } = useGeneralProductForm();
  return (
    <Spin
      tip="Cargando..."
      spinning={submit}
      indicator={spinnerIndicator}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={handleChangeValues}
        onKeyDown={handleFormKeyDown}
        style={{
          gap: '10px',
          display: 'grid',
        }}
      >
        <Row gutter={16}>
          <Col
            span={16}
            style={{
              display: 'grid',
            }}
          >
            <Space
              orientation="vertical"
              style={{
                width: '100%',
              }}
            >
              <ProductInfo product={product} productBrands={productBrands} />
              <InventoryInfo />

              <PriceInfo />
            </Space>
          </Col>
          <ProductMediaSidebar
            product={product}
            showImageManager={showImageManager}
          />
        </Row>
        <PriceCalculator />
        <Footer>
          <Button htmlType="button" onClick={handleReset}>
            Cancelar
          </Button>

          <Button type="primary" htmlType="submit" disabled={submit}>
            {submitLabel}
          </Button>
        </Footer>
      </Form>
    </Spin>
  );
};
const Footer = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  height: min-content;
`;
