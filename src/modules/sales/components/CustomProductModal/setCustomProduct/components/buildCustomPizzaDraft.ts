export interface CustomProductPricing {
  price: number;
  cost: number;
  tax: number;
}

export interface CustomProductDraft {
  name: string;
  id: string;
  pricing: CustomProductPricing;
  amountToBuy: number;
  size: string;
}

export const EMPTY_CUSTOM_PIZZA_DRAFT: CustomProductDraft = {
  name: '',
  id: '',
  pricing: {
    price: 0,
    cost: 0,
    tax: 0,
  },
  amountToBuy: 1,
  size: '',
};

interface BuildCustomPizzaDraftInput {
  currentDraft?: CustomProductDraft;
  productName: string;
  calculatedPrice: number;
  size: string;
  createId?: () => string;
}

export const buildCustomPizzaDraft = ({
  currentDraft = EMPTY_CUSTOM_PIZZA_DRAFT,
  productName,
  calculatedPrice,
  size,
  createId,
}: BuildCustomPizzaDraftInput): CustomProductDraft => {
  const hasProductName = Boolean(productName);

  return {
    ...currentDraft,
    name: productName,
    pricing: {
      ...currentDraft.pricing,
      price: hasProductName ? calculatedPrice : 0,
    },
    size,
    id: hasProductName ? currentDraft.id || createId?.() || '' : '',
  };
};
