import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
// Add missing import
import { DateTime } from 'luxon';
import { nanoid } from 'nanoid';

import {
  getDefaultTransactionCondition,
  getDefaultTransactionStatus,
} from '@/constants/orderAndPurchaseState';

interface BackOrderSelection {
  id: string;
  quantity: number;
}

interface ProductSelected {
  key?: string;
  id: string;
  name: string;
  expirationDate?: string | null;
  quantity: number;
  purchaseQuantity: number;
  selectedBackOrders: BackOrderSelection[];
  unitMeasurement: string;
  baseCost: number;
  taxPercentage?: number;
  freight?: number;
  otherCosts?: number;
  unitCost: number;
  subtotal: number;
  initialCost?: number;
  originalId?: string;
  pricing?: { cost?: number };
}

interface OrderState {
  condition?: string;
  numberId: string;
  id: string;
  createdAt: string;
  deletedAt: string;
  completedAt: string;
  deliveryAt: string | null;
  paymentAt: string;
  note: string;
  provider: any;
  replenishments: ProductSelected[];
  status?: string;
  attachmentUrls: any[];
  receiptImgUrl: string;
  receiptUrl?: string;
  total: number;
}

interface AddOrderState {
  productSelected: ProductSelected;
  order: OrderState;
  mode?: string;
}

interface AddOrderRootState {
  addOrder: AddOrderState;
}

// Agregar funciones auxiliares para cálculos (idénticas a las de addPurchaseSlice)
const calculateUnitCost = (product: Partial<ProductSelected>): number => {
  const baseCost = Number(product.baseCost) || 0;
  const tax = (baseCost * (Number(product.taxPercentage) || 0)) / 100;
  const freight = Number(product.freight) || 0;
  const otherCosts = Number(product.otherCosts) || 0;
  return baseCost + tax + freight + otherCosts;
};

const calculateSubTotal = (product: Partial<ProductSelected>): number => {
  const quantity = Number(product.purchaseQuantity || product.quantity) || 0;
  const unitCost = calculateUnitCost(product);
  return quantity * unitCost;
};

const EmptyOrder: OrderState = {
  condition: getDefaultTransactionCondition()?.id,
  numberId: '',
  id: '',
  createdAt: '',
  deletedAt: '',
  completedAt: '',
  deliveryAt: DateTime.now().toISO(),
  paymentAt: '',
  note: '',
  provider: null,
  replenishments: [],
  status: getDefaultTransactionStatus().id,
  attachmentUrls: [],
  receiptImgUrl: '',
  total: 0,
};

// Actualizar EmptyProductSelected para incluir propiedades usadas en la lógica de backorders y cálculos
const EmptyProductSelected: ProductSelected = {
  id: '',
  name: '',
  quantity: 0,
  purchaseQuantity: 0, // Cantidad total a comprar
  selectedBackOrders: [], // Solo contendrá {id, quantity}
  unitMeasurement: '', // agregado
  baseCost: 0, // agregado
  unitCost: 0, // agregado
  subtotal: 0, // agregado
};

const initialState: AddOrderState = {
  productSelected: EmptyProductSelected,
  order: EmptyOrder,
};
const addOrderSlice = createSlice({
  name: 'addOrder',
  initialState,
  reducers: {
    getOrderData: (state: AddOrderState, actions: PayloadAction<OrderState | null>) => {
      const data = actions.payload;
      state.order = data ? data : EmptyOrder;
    },
    setProductSelected: (state: AddOrderState, actions: PayloadAction<Partial<ProductSelected>>) => {
      const newValue = actions.payload;
      state.productSelected = { ...state.productSelected, ...newValue };
    },
    SelectProduct: (state: AddOrderState, actions: PayloadAction<any>) => {
      const product = actions.payload;
      let productData: ProductSelected = {
        key: nanoid(),
        id: product.id,
        name: product.name,
        expirationDate: product.expirationDate ?? null, // Use null for empty date
        quantity: product.quantity ?? 1,
        purchaseQuantity: product.purchaseQuantity ?? (product.quantity ?? 1), // Use existing purchaseQuantity or default to quantity, then 1
        selectedBackOrders: [], // BackOrders seleccionados
        unitMeasurement: product.unitMeasurement ?? '',
        baseCost: product.pricing?.cost ?? product.baseCost ?? 0, // Use pricing cost, then product baseCost, then 0
        taxPercentage: product.taxPercentage ?? 0,
        freight: product.freight ?? 0,
        otherCosts: product.otherCosts ?? 0,
        unitCost: 0,
        subtotal: 0,
      };

      productData.unitCost = calculateUnitCost(productData);
      productData.subtotal = calculateSubTotal(productData);

      state.productSelected = productData;
    },
    AddProductToOrder: (state: AddOrderState) => {
      state.order.replenishments.push(state.productSelected);
      state.productSelected = EmptyProductSelected; // Fix reference
    },
    setOrder: (state: AddOrderState, actions: PayloadAction<Partial<OrderState>>) => {
      const { ...rest } = actions.payload;

      state.order = {
        ...state.order,
        ...rest,
      };
    },
    getInitialCost: (state: AddOrderState, actions: PayloadAction<{ initialCost: number }>) => {
      const { initialCost } = actions.payload;
      state.productSelected.initialCost = initialCost;
    },
    cleanOrder: (state: AddOrderState) => {
      state.productSelected = EmptyProductSelected; // Fix reference
      state.order = EmptyOrder;
      state.mode = 'add';
    },
    updateProduct: (state: AddOrderState, action: PayloadAction<{ value: Partial<ProductSelected> }>) => {
      const { value } = action.payload;
      const productIndex = state.order.replenishments.findIndex((item) => {
        const matchesKey = value?.key && item.key === value.key;
        const matchesId = value?.id && item.id === value.id;
        const matchesOriginalId =
          value?.originalId && item.id === value.originalId;
        return (matchesKey || matchesId || matchesOriginalId) ?? false;
      });
      if (productIndex === -1) return;
      const currentProduct = state.order.replenishments[productIndex];
      const selectedBackOrders =
        value.selectedBackOrders !== undefined
          ? value.selectedBackOrders
          : currentProduct.selectedBackOrders || [];
      const totalBackordersQuantity = selectedBackOrders.reduce(
        (sum, order) => sum + order.quantity,
        0,
      );
      const purchaseQuantity =
        value.purchaseQuantity !== undefined
          ? value.purchaseQuantity
          : value.quantity !== undefined
            ? value.quantity + totalBackordersQuantity
            : currentProduct.purchaseQuantity;
      const quantity =
        value.quantity !== undefined
          ? value.quantity
          : Math.max(0, purchaseQuantity - totalBackordersQuantity);
      const updatedProduct = {
        ...currentProduct,
        ...value,
        purchaseQuantity,
        quantity,
        selectedBackOrders,
      };
      state.order.replenishments[productIndex] = {
        ...updatedProduct,
        unitCost: calculateUnitCost(updatedProduct),
        subtotal: calculateSubTotal(updatedProduct),
      } as ProductSelected;
    },
    addAttachmentToOrder: (state: AddOrderState, actions: PayloadAction<any>) => {
      state.order.attachmentUrls = [
        ...state.order.attachmentUrls,
        actions.payload,
      ];
    },

    clearProductSelected: (state: AddOrderState) => {
      state.productSelected = EmptyProductSelected;
    },
    deleteReceiptImageFromOrder: (state: AddOrderState) => {
      state.order.receiptUrl = '';
    },
    deleteProductFromOrder: (state: AddOrderState, actions: PayloadAction<{ id?: string; key?: string }>) => {
      const { id, key } = actions.payload;
      state.order.replenishments = state.order.replenishments.filter(
        (item: ProductSelected) => {
          const matchesKey = key && item.key === key;
          const matchesId = id && item.id === id;
          return !(matchesKey || matchesId);
        },
      );
    },
    setSelectedBackOrders: (state: AddOrderState, action: PayloadAction<{ selectedBackOrders: BackOrderSelection[]; purchaseQuantity: number }>) => {
      const { selectedBackOrders, purchaseQuantity } = action.payload;
      const totalBackordersQuantity = selectedBackOrders.reduce(
        (sum: number, order: BackOrderSelection) => sum + order.quantity,
        0,
      );

      state.productSelected = {
        ...state.productSelected,
        selectedBackOrders, // Solo contiene {id, quantity}
        purchaseQuantity,
        quantity: Math.max(0, purchaseQuantity - totalBackordersQuantity),
      };
    },
    setPurchaseQuantity: (state: AddOrderState, action: PayloadAction<number>) => {
      const quantity = action.payload;
      const totalBackordersQuantity =
        state.productSelected.selectedBackOrders.reduce(
          (sum: number, order: BackOrderSelection) => sum + order.quantity,
          0,
        );

      state.productSelected = {
        ...state.productSelected,
        purchaseQuantity: quantity,
        quantity: Math.max(0, quantity - totalBackordersQuantity),
      };
    },
    clearSelectedBackOrders: (state: AddOrderState) => {
      state.productSelected = {
        ...state.productSelected,
        selectedBackOrders: [],
        purchaseQuantity: state.productSelected.quantity,
        quantity: state.productSelected.quantity,
      };
    },
  },
});

export const {
  setOrder,
  cleanOrder,
  getOrderData,
  SelectProduct,
  updateProduct,
  deleteProductFromOrder,
  deleteReceiptImageFromOrder,
  clearProductSelected,
  getInitialCost,
  AddProductToOrder,
  setProductSelected,
  setSelectedBackOrders,
  setPurchaseQuantity,
  clearSelectedBackOrders,
} = addOrderSlice.actions;

export const selectProductSelected = (state: AddOrderRootState) => state.addOrder.productSelected;
export const selectProducts = (state: AddOrderRootState) => state.addOrder.order.replenishments;
export const selectOrder = (state: AddOrderRootState) => state.addOrder.order;
export const selectOrderState = (state: AddOrderRootState) => state.addOrder;
export const selectTotalOrder = (state: AddOrderRootState) => state.addOrder.order.total;

export default addOrderSlice.reducer;
