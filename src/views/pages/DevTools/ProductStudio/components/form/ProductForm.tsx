// @ts-nocheck
import { Form, Space } from 'antd';
import styled from 'styled-components';

import { CodesSection } from '@/views/pages/DevTools/ProductStudio/components/sections/CodesSection';
import { IdentitySection } from '@/views/pages/DevTools/ProductStudio/components/sections/IdentitySection';
import { InventorySection } from '@/views/pages/DevTools/ProductStudio/components/sections/InventorySection';
import { PricingSection } from '@/views/pages/DevTools/ProductStudio/components/sections/PricingSection';
import { WarrantySection } from '@/views/pages/DevTools/ProductStudio/components/sections/WarrantySection';

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
