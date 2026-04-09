import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';

import { OPERATION_MODES } from '@/constants/modes';

export interface ProductSelected {
  id: string | null;
  product?: any;
  motive?: string;
  quantityRemoved?: number;
  observations?: string;
  status?: boolean;
}

export interface ProductOutflowData {
  id?: string | null;
  productList: ProductSelected[];
  date?: any;
}

export interface ProductOutflowState {
  mode: string;
  productSelected: ProductSelected;
  data: ProductOutflowData;
}

const EmptyProductsOutflow: ProductSelected[] = [];

const EmptyProduct: ProductSelected = {
  id: null, // Identificador único del producto
  product: null, // Identificador del producto específico que se vende
  motive: '', //Identificador de la razón detrás de la salida del producto
  quantityRemoved: 0,
  observations: '', // Cualquier comentario adicional o notas relacionadas con el producto
  status: false, // El estado de la salida del producto (si se ha completado o no)
};
const EmptyProductOutflow: ProductOutflowData = {
  productList: EmptyProductsOutflow, // Lista de productos que se venden
};
const initialState: ProductOutflowState = {
  mode: OPERATION_MODES.CREATE.label,
  productSelected: EmptyProduct,
  data: {
    productList: EmptyProductsOutflow,
  },
};

export const productOutflowSlice = createSlice({
  name: 'productOutflow',
  initialState,
  reducers: {
    selectProduct: (
      state: ProductOutflowState,
      actions: PayloadAction<Partial<ProductSelected>>,
    ) => {
      const newData = actions.payload;
      state.productSelected = {
        ...(state.productSelected || {}),
        ...(newData || {}),
        id: state.productSelected?.id || nanoid(10),
      };
    },
    addProductToProductOutflow: (
      state: ProductOutflowState,
      actions: PayloadAction<ProductSelected>,
    ) => {
      const data = {
        ...actions.payload,
      };
      state.data.productList = [...state.data.productList, data];
      state.productSelected = EmptyProduct;
    },
    updateProductFromProductOutflow: (
      state: ProductOutflowState,
      action: PayloadAction<{ id: string; data: Partial<ProductSelected> }>,
    ) => {
      const { id, data } = action.payload;
      const updatedProductList = state.data.productList.map(
        (product: ProductSelected) => {
          if (product.id === id) {
            return { ...product, ...data };
          }
          return product;
        },
      );
      state.data.productList = updatedProductList;
    },
    deleteProductFromProductOutflow: (
      state: ProductOutflowState,
      actions: PayloadAction<{ id: string }>,
    ) => {
      const { id } = actions.payload;
      const checkingId = state.data.productList.filter(
        (item: ProductSelected) => item.id !== id,
      );
      if (checkingId) {
        state.data.productList = checkingId;
      }
    },
    setProductOutflowData: (
      state: ProductOutflowState,
      actions: PayloadAction<any>,
    ) => {
      const { data } = actions.payload;

      return {
        ...state,
        productSelected: data.productSelected,
        data: {
          ...state.data,
          ...data.data,
        },
        mode: data.mode,
      };
    },
    deleteData: (state: ProductOutflowState) => {
      state.mode = OPERATION_MODES.CREATE.label;
      state.productSelected = EmptyProduct;
      state.data = EmptyProductOutflow;
    },
  },
});

export const {
  selectProduct,
  addProductToProductOutflow,
  deleteProductFromProductOutflow,
  deleteData,
  updateProductFromProductOutflow,
  setProductOutflowData,
} = productOutflowSlice.actions;

interface ProductOutflowRootState {
  productOutflow: ProductOutflowState;
}

//selectors
export const SelectProductOutflow = (state: ProductOutflowRootState) =>
  state.productOutflow;
export const SelectProductSelected = (state: ProductOutflowRootState) =>
  state.productOutflow.productSelected;
export const SelectProductList = (state: ProductOutflowRootState) =>
  state.productOutflow.data.productList;

export default productOutflowSlice.reducer;
