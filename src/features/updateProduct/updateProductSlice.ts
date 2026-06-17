import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import {
  DEFAULT_PRODUCT_ITEM_TYPE,
  PRODUCT_BRAND_DEFAULT,
  initTaxes,
  warrantyOptions,
} from '@/domain/products/productDefaults';

const normalizeBrand = (value: any) => {
  if (typeof value !== 'string') {
    return PRODUCT_BRAND_DEFAULT;
  }
  const trimmed = value.replace(/\s+/g, ' ').trim();
  return trimmed || PRODUCT_BRAND_DEFAULT;
};

const createEmptyProduct = () => ({
  name: '',
  brand: PRODUCT_BRAND_DEFAULT,
  image: '',
  category: '',
  itemType: DEFAULT_PRODUCT_ITEM_TYPE,
  pricing: {
    currency: 'DOP',
    cost: 0,
    price: 0,
    listPrice: 0,
    avgPrice: 0,
    minPrice: 0,
    cardPrice: 0,
    offerPrice: 0,
    tax: initTaxes[0],
  },
  promotions: {
    start: null,
    end: null,
    discount: 0,
    isActive: false,
  },
  weightDetail: {
    isSoldByWeight: false,
    weightUnit: 'lb',
    weight: 0,
  },
  warranty: {
    status: false,
    unit: warrantyOptions[1]?.value || '',
    quantity: 1,
  },
  size: '',
  type: '',
  stock: 0,
  totalUnits: null,
  packSize: 1, // Cantidad de productos en un paquete
  netContent: '',
  restrictSaleWithoutStock: false,
  activeIngredients: '',
  amountToBuy: 1,
  createdBy: 'unknown',
  id: '',
  isVisible: true,
  trackInventory: true,
  qrcode: '',
  barcode: '',
  order: 1,
  hasExpirationDate: false,
  selectedSaleUnit: null,
});

const initialState = {
  status: false,
  product: createEmptyProduct(),
};

const updateProductSlice = createSlice({
  name: 'updateProduct',
  initialState,
  reducers: {
    ChangeProductData: (state: any, action: PayloadAction<any>) => {
      const { status, product } = action.payload;
      if (status && !state.status) {
        state.status = status;
      }
      const merged = {
        ...state.product,
        ...product,
      };
      if (product && Object.prototype.hasOwnProperty.call(product, 'brand')) {
        merged.brand = normalizeBrand(product?.brand);
      } else {
        merged.brand = normalizeBrand(merged.brand);
      }
      state.product = merged;
    },
    setProduct: (state: any, action: PayloadAction<any>) => {
      const product = action.payload;
      const merged = {
        ...state.product,
        ...product,
      };
      merged.brand = normalizeBrand(merged.brand);
      state.product = merged;
    },
    ChangeProductImage: (state: any, action: PayloadAction<any>) => {
      state.product.image = action.payload;
    },
    changeProductPrice: (state: any, action: PayloadAction<any>) => {
      state.product.pricing = {
        ...state.product.pricing,
        ...action?.payload?.pricing,
      };
      const hasPricing =
        action?.payload?.pricing && typeof action.payload.pricing === 'object';
      // Si se actualiza el listPrice (aunque sea 0), también actualizar el price principal
      if (
        hasPricing &&
        Object.prototype.hasOwnProperty.call(
          action.payload.pricing,
          'listPrice',
        )
      ) {
        state.product.pricing.price = action.payload.pricing.listPrice;
      }
      // Si se actualiza el price directamente, mantenerlo (tiene prioridad explícita)
      if (
        hasPricing &&
        Object.prototype.hasOwnProperty.call(action.payload.pricing, 'price')
      ) {
        state.product.pricing.price = action.payload.pricing.price;
      }
    },
    clearUpdateProductData: (state: any) => {
      state.product = createEmptyProduct();
      state.status = false;
    },
  },
});

export const {
  ChangeProductData,
  changeProductPrice,
  clearUpdateProductData,
  ChangeProductImage,
  setProduct,
} = updateProductSlice.actions;

//selectors
export const selectUpdateProductData = (state: any) => state.updateProduct;
export const selectUpdateProductStatus = (state: any) =>
  state.updateProduct.status;
export const selectIsSoldInUnits = (state: any) =>
  state.updateProduct.product.isSoldInUnits;
export const selectSelectedSaleUnit = (state: any) => {
  const { selectedSaleUnitId, saleUnits } = state.updateProduct.product;
  return (
    (saleUnits || []).find((unit: any) => unit.id === selectedSaleUnitId) ||
    null
  );
};

export default updateProductSlice.reducer;
