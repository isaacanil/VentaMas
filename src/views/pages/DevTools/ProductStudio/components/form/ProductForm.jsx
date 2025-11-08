import { Form, Space } from 'antd';
import styled from 'styled-components';

import { CodesSection } from '../sections/CodesSection';
import { IdentitySection } from '../sections/IdentitySection';
import { InventorySection } from '../sections/InventorySection';
import { PricingSection } from '../sections/PricingSection';
import { WarrantySection } from '../sections/WarrantySection';

const FormWrapper = styled.div`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
`;

export const ProductForm = ({
  form,
  onValuesChange,
  brandMeta,
  brandOptions,
  categories,
  activeIngredients,
  sectionDomIds,
  previewMetrics,
  product,
  onOpenBrandModal,
  onAddCategory,
  onAddActiveIngredient,
  onOpenImageManager,
  onResetImage,
}) => {
  const pricingValues = Form.useWatch('pricing', form);

  return (
    <FormWrapper>
      <Form
        form={form}
        layout="vertical"
        onValuesChange={onValuesChange}
        style={{ width: '100%' }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <IdentitySection
          domId={sectionDomIds.identity}
          brandMeta={brandMeta}
          brandOptions={brandOptions}
          categories={categories}
          activeIngredients={activeIngredients}
          product={product}
          onOpenBrandModal={onOpenBrandModal}
          onAddCategory={onAddCategory}
          onAddActiveIngredient={onAddActiveIngredient}
          onOpenImageManager={onOpenImageManager}
          onResetImage={onResetImage}
        />

        <PricingSection
          domId={sectionDomIds.pricing}
          previewMetrics={previewMetrics}
          pricingValues={pricingValues}
        />

        <InventorySection domId={sectionDomIds.inventory} />

        <WarrantySection domId={sectionDomIds.warranty} />

        <CodesSection domId={sectionDomIds.codes} />
      </Space>
    </Form>
    </FormWrapper>
  );
};
