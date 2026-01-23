import { Form, Space } from 'antd';
import type { FormInstance } from 'antd';
import styled from 'styled-components';

import { CodesSection } from '@/modules/dev/pages/DevTools/ProductStudio/components/sections/CodesSection';
import { IdentitySection } from '@/modules/dev/pages/DevTools/ProductStudio/components/sections/IdentitySection';
import { InventorySection } from '@/modules/dev/pages/DevTools/ProductStudio/components/sections/InventorySection';
import { PricingSection } from '@/modules/dev/pages/DevTools/ProductStudio/components/sections/PricingSection';
import { WarrantySection } from '@/modules/dev/pages/DevTools/ProductStudio/components/sections/WarrantySection';
import type { CategoryDocument } from '@/firebase/categories/types';
import type {
  ActiveIngredient,
  PricingTax,
  ProductRecord,
} from '@/types/products';
import type { SectionId } from '@/modules/dev/pages/DevTools/ProductStudio/utils/sections';

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

interface BrandOption {
  value: string;
  label: string;
}

type PricingValues = {
  cost?: number | string | null;
  tax?: PricingTax;
  listPrice?: number | string | null;
  midPrice?: number | string | null;
  minPrice?: number | string | null;
  cardPrice?: number | string | null;
  offerPrice?: number | string | null;
};

type ProductFormValues = Omit<ProductRecord, 'pricing'> & {
  pricing?: PricingValues;
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

