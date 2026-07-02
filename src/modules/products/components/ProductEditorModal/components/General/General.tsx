import { Form, Button, Spin, Space, Row, Col } from 'antd';
import { useSelector } from 'react-redux';

import { selectUpdateProductData } from '@/features/updateProduct/updateProductSlice';
import type { ProductRecord } from '@/types/products';

import { Footer } from './General.styles';
import { ProductMediaSidebar } from './components/ProductMediaSidebar';
import { useGeneralProductForm } from './hooks/useGeneralProductForm';
import { ComboRecipeEditor } from '../../../ComboRecipeEditor';
import { ComboAvailabilityInfo } from '../sections/ComboAvailabilityInfo';
import { InventoryInfo } from '../sections/InventoryInfo';
import { PriceCalculator } from '../sections/PriceCalculator';
import { ComboPriceInfo, PriceInfo } from '../sections/PriceInfo';
import { ProductInfo } from '../sections/ProductInfo';
import { SaleUnitsInfo } from '../sections/SaleUnitsInfo';

type GeneralProps = {
  showImageManager: () => void;
};

export const General = ({ showImageManager }: GeneralProps) => {
  const { product } = useSelector(selectUpdateProductData) as {
    product: ProductRecord;
  };
  const {
    form,
    businessId,
    handleChangeValues,
    handleFormKeyDown,
    handleReset,
    onFinish,
    productBrands,
    spinnerIndicator,
    submit,
    submitLabel,
  } = useGeneralProductForm();
  const watchedItemType = Form.useWatch('itemType', form);
  const itemType = watchedItemType ?? product?.itemType;
  const isCombo = itemType === 'combo';
  const isService = itemType === 'service';
  const watchedInventoryRole = Form.useWatch('inventoryRole', form);
  const inventoryRole = watchedInventoryRole ?? product?.inventoryRole;
  const isRawMaterial =
    itemType === 'product' && inventoryRole === 'raw_material';

  return (
    <Spin
      description="Cargando..."
      indicator={spinnerIndicator}
      spinning={submit}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={handleChangeValues}
        onKeyDown={handleFormKeyDown}
        scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
        style={{
          minWidth: 0,
          width: '100%',
        }}
      >
        <Row
          gutter={16}
          style={{ marginBottom: 10, minWidth: 0, width: '100%' }}
        >
          <Col
            xs={24}
            lg={isCombo ? 24 : 16}
            style={{
              display: 'grid',
              minWidth: 0,
            }}
          >
            <Space
              orientation="vertical"
              style={{
                maxWidth: '100%',
                minWidth: 0,
                width: '100%',
              }}
            >
              <ProductInfo
                isCombo={isCombo}
                isService={isService}
                isRawMaterial={isRawMaterial}
                product={product}
                productBrands={productBrands}
              />
              {isCombo ? <ComboAvailabilityInfo /> : null}
              {!isCombo && !isService ? (
                <InventoryInfo isRawMaterial={isRawMaterial} />
              ) : null}
              {isCombo ? (
                <ComboRecipeEditor
                  businessId={businessId}
                  currentProductId={product?.id}
                />
              ) : null}

              {isCombo ? (
                <ComboPriceInfo />
              ) : (
                <PriceInfo isService={isService} isRawMaterial={isRawMaterial} />
              )}
            </Space>
          </Col>
          {!isCombo ? (
            <ProductMediaSidebar
              isService={isService}
              isRawMaterial={isRawMaterial}
              product={product}
              showImageManager={showImageManager}
            />
          ) : null}
        </Row>
        {!isCombo && !isRawMaterial ? <PriceCalculator /> : null}
        {!isCombo && !isService && !isRawMaterial ? (
          <SaleUnitsInfo pricing={product?.pricing} />
        ) : null}
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
