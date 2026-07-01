import { Form, Space } from 'antd';
import type { FormInstance } from 'antd';
import styled from 'styled-components';

import { CodesSection } from '@/modules/dev/pages/DevTools/ProductStudio/components/sections/CodesSection';
import { IdentitySection } from '@/modules/dev/pages/DevTools/ProductStudio/components/sections/IdentitySection';
import { InventorySection } from '@/modules/dev/pages/DevTools/ProductStudio/components/sections/InventorySection';
import { PricingSection } from '@/modules/dev/pages/DevTools/ProductStudio/components/sections/PricingSection';
import { SaleUnitsSection } from '@/modules/dev/pages/DevTools/ProductStudio/components/sections/SaleUnitsSection';
import { WarrantySection } from '@/modules/dev/pages/DevTools/ProductStudio/components/sections/WarrantySection';
import type { BrandOption } from '@/domain/products/brandSelection';
import type { CategoryDocument } from '@/firebase/categories/types';
import type {
  ActiveIngredient,
  ProductRecord,
  ProductSaleUnit,
} from '@/types/products';
import type { SectionId } from '@/modules/dev/pages/DevTools/ProductStudio/utils/sections';
import type { ProductPricingFormValues } from '@/domain/products/pricingForm';

const FormWrapper = styled.div`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
`;

interface BrandMeta {
  label: string;
  placeholder: string;
  helper: string;
}

export type PricingValues = ProductPricingFormValues;

export type ProductSaleUnitFormValues = Omit<ProductSaleUnit, 'pricing'> & {
  pricing?: PricingValues;
};

export type ProductFormValues = Omit<ProductRecord, 'pricing' | 'saleUnits'> & {
  pricing?: PricingValues;
  saleUnits?: ProductSaleUnitFormValues[];
};

type SectionDomIds = Record<SectionId, string>;

interface ProductFormProps {
  form: FormInstance<ProductFormValues>;
  onValuesChange?: (
    changedValues: Partial<ProductFormValues>,
    allValues: ProductFormValues,
  ) => void;
  brandMeta: BrandMeta;
  brandOptions: BrandOption[];
  categories: CategoryDocument[];
  activeIngredients: ActiveIngredient[];
  sectionDomIds: SectionDomIds;
  product?: ProductRecord | null;
  isUpdateMode: boolean;
  onOpenBrandModal: () => void;
  onAddCategory: () => void;
  onAddActiveIngredient: () => void;
  onOpenImageManager: () => void;
  onResetImage: () => void;
}

export const ProductForm = ({
  form,
  onValuesChange,
  brandMeta,
  brandOptions,
  categories,
  activeIngredients,
  sectionDomIds,
  product,
  isUpdateMode,
  onOpenBrandModal,
  onAddCategory,
  onAddActiveIngredient,
  onOpenImageManager,
  onResetImage,
}: ProductFormProps) => {
  const pricingValues = Form.useWatch<PricingValues>('pricing', form);

  return (
    <FormWrapper>
      <Form
        form={form}
        layout="vertical"
        onValuesChange={onValuesChange}
        scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
        style={{ width: '100%' }}
      >
        <Space
          orientation="vertical"
          size="middle"
          style={{ width: '100%', paddingBottom: '12rem' }}
        >
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

          <SaleUnitsSection
            domId={sectionDomIds.saleUnits}
            pricingValues={pricingValues}
          />

          <InventorySection
            domId={sectionDomIds.inventory}
            isUpdateMode={isUpdateMode}
          />

          <WarrantySection domId={sectionDomIds.warranty} />

          <CodesSection domId={sectionDomIds.codes} product={product} />
        </Space>
      </Form>
    </FormWrapper>
  );
};
